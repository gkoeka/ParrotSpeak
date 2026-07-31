import OpenAI from "openai";
import { reportError } from "../utils/errorReporting";
import { getLanguageByCode } from "../../constants/languageConfiguration";
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

// Extracted so scripts/compare-translation-models.ts can test against the exact
// production prompt instead of a hand-copied approximation that could drift from it.
export function buildTranslationPrompt(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): string {
  // Simplify language codes for the prompt (e.g., "en-US" to "English")
  const sourceLanguageName = getLanguageName(sourceLanguage);
  const targetLanguageName = getLanguageName(targetLanguage);

  return `
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
}

export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<TranslationResponse> {
  try {
    const prompt = buildTranslationPrompt(text, sourceLanguage, targetLanguage);

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
    reportError(error, { sourceLanguage, targetLanguage, textLength: text.length });

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

// Look up a language's display name from the single canonical source
// (constants/languageConfiguration.ts) instead of a separately maintained map here,
// which had drifted out of sync with the app's actual supported codes (e.g. "en",
// "zh", "nl-NL" all fell through to returning the raw code).
function getLanguageName(languageCode: string): string {
  return getLanguageByCode(languageCode)?.name || languageCode;
}
