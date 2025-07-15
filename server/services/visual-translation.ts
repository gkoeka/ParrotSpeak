import OpenAI from "openai";
import { pool } from "@db";
import { usageStatistics } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "@db";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Analyze an image with OpenAI's Vision model and extract text for translation
 * @param imageBuffer The image buffer to analyze
 * @param sourceLanguage Source language code
 * @param targetLanguage Target language code
 * @returns The extracted text and its translation
 */
export async function analyzeImageAndTranslate(
  imageBase64: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<{ extractedText: string; translation: string }> {
  try {
    // First, we use Vision to extract the text from the image
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `Extract all text from the image. The text is likely in ${sourceLanguage}. 
                   Return ONLY the extracted text, nothing else.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the text from this image:"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ],
        },
      ],
      max_tokens: 500,
    });

    const extractedText = visionResponse.choices[0].message.content?.trim() || "";
    
    if (!extractedText) {
      throw new Error("No text was extracted from the image");
    }

    // Then, we translate the extracted text
    const translationResponse = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a translation assistant. Translate the following text from ${sourceLanguage} to ${targetLanguage}. 
                   Keep the translation natural and context-aware. Preserve formatting where possible.
                   Return ONLY the translated text, nothing else.`
        },
        {
          role: "user",
          content: extractedText
        }
      ],
      max_tokens: 1000,
    });

    const translation = translationResponse.choices[0].message.content?.trim() || "";
    
    if (!translation) {
      throw new Error("Translation failed");
    }

    // Update usage statistics for this language pair
    const characterCount = extractedText.length;
    const sourceLanguageCode = sourceLanguage.split('-')[0];
    const targetLanguageCode = targetLanguage.split('-')[0];
    
    await db.insert(usageStatistics).values({
      date: new Date().toISOString().split('T')[0],
      languagePair: `${sourceLanguageCode}-${targetLanguageCode}`,
      characterCount,
      messageCount: 1,
      averageResponseTime: "0", // Not tracking response time for image translation currently
    });

    return {
      extractedText,
      translation
    };
  } catch (error: any) {
    console.error("Error in visual translation:", error);
    throw new Error(`Failed to analyze image: ${error.message || 'Unknown error'}`);
  }
}