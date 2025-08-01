import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Transcribe audio using OpenAI Whisper API
 * @param audioBuffer Buffer containing audio data
 * @param language Optional language code for transcription
 * @returns Promise<string> - Transcribed text
 */
export async function transcribeAudio(audioBuffer: Buffer, language?: string): Promise<string> {
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

    const tempFileName = `audio_${uuidv4()}.webm`;
    const tempFilePath = path.join(tempDir, tempFileName);

    try {
      // Write audio buffer to temporary file
      fs.writeFileSync(tempFilePath, audioBuffer);

      // Check the actual file type
      console.log(`Audio file created: ${tempFilePath}, size: ${audioBuffer.length} bytes`);
      console.log('First 20 bytes of audio buffer:', audioBuffer.subarray(0, 20));
      
      // For debugging: try to identify the actual format
      const header = audioBuffer.subarray(0, 12).toString('hex');
      console.log('Audio file header (hex):', header);

      // Try using FormData for better format handling
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', fs.createReadStream(tempFilePath), {
        filename: 'audio.webm',
        contentType: 'audio/webm',
      });
      form.append('model', 'whisper-1');
      form.append('response_format', 'text');

      // Convert language code to ISO-639-1 format if needed
      const convertLanguageCode = (lang?: string): string | undefined => {
        if (!lang) return undefined;
        
        // Common language code conversions
        const languageMap: { [key: string]: string } = {
          'en-us': 'en',
          'en-gb': 'en',
          'es-es': 'es',
          'es-mx': 'es',
          'fr-fr': 'fr',
          'de-de': 'de',
          'pt-br': 'pt',
          'pt-pt': 'pt',
          'zh-cn': 'zh',
          'zh-tw': 'zh',
          'ja-jp': 'ja',
          'ko-kr': 'ko',
          'it-it': 'it',
          'ru-ru': 'ru',
          'ar-sa': 'ar',
          'hi-in': 'hi',
          'th-th': 'th',
          'vi-vn': 'vi'
        };
        
        // If it's already in ISO-639-1 format (2 letters), return as is
        if (lang.length === 2) return lang;
        
        // Convert from locale format to ISO-639-1
        return languageMap[lang.toLowerCase()] || lang.split('-')[0];
      };

      // Add language if provided
      if (convertLanguageCode(language)) {
        form.append('language', convertLanguageCode(language));
      }

      // Make direct HTTP request with FormData
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          ...form.getHeaders(),
        },
        body: form,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const transcription = await response.text();
      
      console.log('OpenAI transcription successful:', transcription.substring(0, 50) + '...');

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);

      return transcription.trim();
    } catch (error) {
      // Clean up temporary file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw error;
    }
  } catch (error) {
    console.error('OpenAI transcription error:', error);
    
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

/**
 * Translate text using OpenAI GPT-4
 * @param text Text to translate
 * @param sourceLanguage Source language code
 * @param targetLanguage Target language code
 * @returns Promise<string> - Translated text
 */
export async function translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}. Only return the translated text, no explanations or additional content.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    return response.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('OpenAI translation error:', error);
    
    // Re-throw with more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid or missing OpenAI API key');
      } else if (error.message.includes('quota') || error.message.includes('billing')) {
        throw new Error('OpenAI API quota exceeded or billing issue');
      } else if (error.message.includes('network') || error.message.includes('connect')) {
        throw new Error('Network error connecting to OpenAI service');
      }
    }
    
    throw new Error('Translation service temporarily unavailable');
  }
}