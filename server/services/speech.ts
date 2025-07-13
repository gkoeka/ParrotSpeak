import OpenAI from "openai";
import { createReadStream } from "fs";
import { writeFile } from "fs/promises";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Transcribes audio data using OpenAI's Whisper API
 * @param audioBuffer The audio buffer to transcribe
 * @param language The language code (optional, Whisper can auto-detect)
 * @returns The transcribed text
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  language?: string
): Promise<string> {
  try {
    // Create a temporary file to store the audio data
    const tempFilePath = path.join(os.tmpdir(), `${uuidv4()}.webm`);

    // Write the buffer to a temporary file
    await writeFile(tempFilePath, audioBuffer);

    // Create a readable stream from the file
    const audioStream = createReadStream(tempFilePath);

    // Call the OpenAI API with the audio file
    const response = await openai.audio.transcriptions.create({
      file: audioStream,
      model: "whisper-1",
      language: language?.split("-")[0], // Get base language code without region
      response_format: "text"
    });

    return response;
  } catch (error) {
    console.error("Speech recognition error:", error);
    
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
    throw new Error(`Speech recognition failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
