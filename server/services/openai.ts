import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { reportError } from '../utils/errorReporting';
import { normalizeLanguageCode } from '../../utils/languageNormalization';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Transcribe audio using OpenAI's gpt-transcribe model (the sole live transcription
 * path - see server/services/translation.ts for the sole live translation path).
 * @param audioBuffer Buffer containing audio data
 * @param languageHints Optional candidate languages to bias detection toward (e.g. a
 *   conversation's two configured participant languages). This is a hint, not a hard
 *   restriction - gpt-transcribe still auto-detects; passing the known candidates just
 *   narrows the guess instead of picking from its full language space.
 * @returns Promise<{ text: string; language?: string }>
 */
export async function transcribeAudio(audioBuffer: Buffer, languageHints?: string[]): Promise<{ text: string; language?: string }> {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // Create a temporary file for the audio
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFileName = `audio_${uuidv4()}.m4a`;
    const tempFilePath = path.join(tempDir, tempFileName);

    try {
      // Write audio buffer to temporary file
      fs.writeFileSync(tempFilePath, audioBuffer);

      // Create a readable stream from the file
      const audioStream = fs.createReadStream(tempFilePath);

      const normalizedHints = languageHints
        ?.map(hint => normalizeLanguageCode(hint))
        .filter((hint): hint is string => !!hint);

      // gpt-transcribe: same /v1/audio/transcriptions endpoint as whisper-1, but takes
      // a `languages` hint array and only supports response_format "json" (no
      // verbose_json). The SDK's installed types (^4.104.0) predate this model, so the
      // request body is cast to `any` - the runtime just forwards whatever properties
      // are present into the multipart form (verified against node_modules/openai's
      // actual create()/createForm() implementation), so this is safe despite the
      // type gap.
      const transcription = await openai.audio.transcriptions.create({
        file: audioStream,
        model: 'gpt-transcribe',
        response_format: 'json',
        ...(normalizedHints?.length ? { languages: normalizedHints } : {}),
      } as any);

      const transcriptionText: string = (transcription as any).text || '';
      const detectedLanguages = (transcription as any).languages as Array<{ code: string }> | undefined;
      const detectedLanguage = detectedLanguages?.[0]?.code;

      console.log(`OpenAI transcription successful (${transcriptionText.length} chars)`);
      if (detectedLanguage) {
        console.log('Detected language:', detectedLanguage);
      }

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);

      return {
        text: transcriptionText.trim(),
        language: detectedLanguage
      };
    } catch (error) {
      // Clean up temporary file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw error;
    }
  } catch (error) {
    console.error('OpenAI transcription error:', error);
    reportError(error, { audioBytes: audioBuffer.length, languageHints });

    // Re-throw with more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid or missing OpenAI API key');
      } else if (error.message.includes('quota') || error.message.includes('billing')) {
        throw new Error('OpenAI API quota exceeded or billing issue');
      } else if (error.message.includes('network') || error.message.includes('connect')) {
        throw new Error('Network error connecting to OpenAI service');
      } else if (error.message.includes('audio') || error.message.includes('file')) {
        throw new Error('Invalid audio format or file error');
      }
    }

    throw new Error('Speech recognition service temporarily unavailable');
  }
}