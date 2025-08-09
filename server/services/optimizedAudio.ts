import OpenAI from 'openai';
import FormData from 'form-data';
import { Readable } from 'stream';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Optimized audio transcription that avoids file I/O
 * Directly streams buffer to OpenAI API
 */
export async function transcribeAudioOptimized(
  audioBuffer: Buffer, 
  language?: string
): Promise<string> {
  const startTime = Date.now();
  
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // Convert language code to ISO-639-1 format if needed
    const convertLanguageCode = (lang?: string): string | undefined => {
      if (!lang) return undefined;
      
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
      
      if (lang.length === 2) return lang;
      return languageMap[lang.toLowerCase()] || lang.split('-')[0];
    };

    // Create form data with the buffer
    const form = new FormData();
    form.append('file', audioBuffer, {
      filename: 'audio.m4a',
      contentType: 'audio/m4a'
    });
    form.append('model', 'whisper-1');
    if (language) {
      form.append('language', convertLanguageCode(language) || '');
    }
    form.append('response_format', 'text');

    // Make direct API call
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders()
      },
      body: form as any
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const transcription = await response.text();
    
    const processingTime = Date.now() - startTime;
    console.log(`⚡ Optimized transcription completed in ${processingTime}ms`);

    return transcription.trim();
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Transcription failed after ${processingTime}ms:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid or missing OpenAI API key');
      } else if (error.message.includes('quota') || error.message.includes('billing')) {
        throw new Error('OpenAI API quota exceeded');
      } else if (error.message.includes('Invalid file format')) {
        throw new Error('Invalid audio format or file error');
      }
    }
    
    throw new Error('Speech recognition service temporarily unavailable');
  }
}

/**
 * Batch translation optimization for multiple text segments
 */
export async function batchTranslateText(
  texts: string[],
  sourceLanguage: string,
  targetLanguage: string
): Promise<string[]> {
  const startTime = Date.now();
  
  try {
    // Create a single prompt for all texts
    const batchPrompt = `
You are an expert translator. Translate the following ${texts.length} texts from ${sourceLanguage} to ${targetLanguage}.
Maintain the exact order and provide one translation per line.

Texts to translate:
${texts.map((text, i) => `${i + 1}. "${text}"`).join('\n')}

Provide translations in the same numbered format:
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: batchPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const result = response.choices[0]?.message?.content || '';
    
    // Parse the numbered responses
    const translations = result
      .split('\n')
      .filter(line => line.match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*"?/, '').replace(/"?\s*$/, ''));
    
    const processingTime = Date.now() - startTime;
    console.log(`⚡ Batch translation (${texts.length} texts) completed in ${processingTime}ms`);
    
    return translations;
  } catch (error) {
    console.error('Batch translation error:', error);
    throw error;
  }
}