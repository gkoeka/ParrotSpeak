import OpenAI from "openai";
interface TranslationResponse {
  translation: string;
  originalText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<TranslationResponse> {
  try {
    // Simplify language codes for the prompt (e.g., "en-US" to "English")
    const sourceLanguageName = getLanguageName(sourceLanguage);
    const targetLanguageName = getLanguageName(targetLanguage);

    // Create a prompt for the translation that emphasizes context, tone, and cultural nuances
    const prompt = `
You are an expert real-time translator who perfectly understands cultural context, slang, tone, and regional dialects.

Translate the following text from ${sourceLanguageName} to ${targetLanguageName}:

"${text}"

Your translation should:
1. Maintain the original tone (formal, casual, friendly, etc.)
2. Keep cultural context and nuances
3. Translate slang appropriately to the target language
4. Sound natural to native speakers of the target language

Respond in JSON format with the following structure:
{
  "translation": "your translation here",
  "notes": "any special notes about cultural context or nuances (if applicable)"
}
`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3, // Keeping relatively low for translation accuracy
    });

    const responseContent = response.choices[0].message.content;
    const parsedResponse = JSON.parse(responseContent || "{}");

    return {
      translation: parsedResponse.translation || "Translation failed",
      originalText: text,
      sourceLanguage,
      targetLanguage,
    };
  } catch (error) {
    console.error("Translation error:", error);
    
    // Check for quota exceeded/rate limit errors
    if (error instanceof Error && 
        (error.message.includes('quota') || 
         error.message.includes('rate limit') || 
         error.message.includes('insufficient_quota'))) {
      throw new Error("OpenAI API quota exceeded. Please update your API key or check your usage limits.");
    }
    
    // Check for connection errors
    if (error instanceof Error && 
        (error.message.includes('connect') || 
         error.message.includes('network') || 
         error.message.includes('ENOTFOUND'))) {
      throw new Error("Cannot connect to OpenAI API. Please check your internet connection.");
    }
    
    // Generic error
    throw new Error(`Translation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper function to convert language codes to language names
function getLanguageName(languageCode: string): string {
  const codeMap: Record<string, string> = {
    // Original languages
    "en-US": "English",
    "en-GB": "British English",
    "es-ES": "Spanish",
    "fr-FR": "French",
    "de-DE": "German",
    "it-IT": "Italian",
    "pt-BR": "Brazilian Portuguese",
    "ja-JP": "Japanese",
    "zh-CN": "Mandarin Chinese",
    "ru-RU": "Russian",
    "ar-SA": "Arabic",
    "hi-IN": "Hindi",
    "ko-KR": "Korean",
    "cs-CZ": "Czech",
    
    // Next five languages
    "bn-BD": "Bengali",
    "id-ID": "Indonesian",
    "tr-TR": "Turkish",
    "vi-VN": "Vietnamese",
    "th-TH": "Thai",
    
    // Popular backpacker and retirement destinations
    "el-GR": "Greek",
    "ms-MY": "Malay",
    "ne-NP": "Nepali",
    "tl-PH": "Filipino",
    "es-CR": "Spanish (Costa Rican)",
    
    // Special languages
    "xsr-NP": "Sherpa",
    "sher": "Sherpa",
    "dz": "Bhutanese (Dzongkha)",
    "yue-HK": "Cantonese",
    
    // Indian languages
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "mr-IN": "Marathi",
    "gu-IN": "Gujarati",
    "ta": "Tamil",
    "te": "Telugu",
    "mr": "Marathi",
    "gu": "Gujarati",
    
    // Eastern Europe
    "pl-PL": "Polish",
    "uk-UA": "Ukrainian",
    "ro-RO": "Romanian",
    "hu-HU": "Hungarian",
    
    // African Languages
    "sw-KE": "Swahili",
    "am-ET": "Amharic",
    "ar-EG": "Arabic (Egyptian)",
    "ar-MA": "Arabic (Moroccan)",
    
    // South/Central America
    "pt-PT": "European Portuguese",
    "qu-PE": "Quechua",
    
    // Middle East
    "fa-IR": "Persian",
    "he-IL": "Hebrew",
    
    // Scandinavia
    "sv-SE": "Swedish",
    "no-NO": "Norwegian",
    "da-DK": "Danish",
    
    // Southeast Asia Additional
    "km-KH": "Khmer",
    "my-MM": "Burmese",
    "lo-LA": "Lao",
    
    // Pacific Islands
    "haw-US": "Hawaiian",
    "fj-FJ": "Fijian",
    
    // Central Asia
    "uz-UZ": "Uzbek",
    "kk-KZ": "Kazakh"
  };

  // Check exact match first
  if (codeMap[languageCode]) {
    return codeMap[languageCode];
  }
  
  // Check base language code without region
  const baseCode = languageCode.split('-')[0];
  if (codeMap[baseCode]) {
    return codeMap[baseCode];
  }
  
  // Fallback to the code itself
  return languageCode;
}
