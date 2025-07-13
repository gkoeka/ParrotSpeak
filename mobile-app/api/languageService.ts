import { Language } from '../types';
import { API_BASE_URL } from '../constants/api';

// Common options that include credentials for all API requests
const credentialsOption = {
  credentials: 'include' as RequestCredentials // Include cookies for authentication
};

// Common headers for JSON requests
const jsonHeaders = {
  'Content-Type': 'application/json'
};

// This is a static implementation since the API doesn't currently provide a language endpoint
export async function getLanguages(): Promise<Language[]> {
  // We'll use a static list of languages to match our web version
  return [
    {
      code: "en-US",
      name: "English",
      country: "United States",
      flag: "https://flagcdn.com/us.svg"
    },
    {
      code: "es-ES",
      name: "Spanish",
      country: "Spain",
      flag: "https://flagcdn.com/es.svg"
    },
    {
      code: "fr-FR",
      name: "French",
      country: "France",
      flag: "https://flagcdn.com/fr.svg"
    },
    {
      code: "de-DE",
      name: "German",
      country: "Germany",
      flag: "https://flagcdn.com/de.svg"
    },
    {
      code: "it-IT",
      name: "Italian",
      country: "Italy",
      flag: "https://flagcdn.com/it.svg"
    },
    {
      code: "ja-JP",
      name: "Japanese",
      country: "Japan",
      flag: "https://flagcdn.com/jp.svg"
    },
    {
      code: "zh-CN",
      name: "Chinese",
      country: "China",
      flag: "https://flagcdn.com/cn.svg"
    },
    {
      code: "ru-RU",
      name: "Russian",
      country: "Russia",
      flag: "https://flagcdn.com/ru.svg"
    },
    {
      code: "ar-SA",
      name: "Arabic",
      country: "Saudi Arabia",
      flag: "https://flagcdn.com/sa.svg"
    },
    {
      code: "hi-IN",
      name: "Hindi",
      country: "India",
      flag: "https://flagcdn.com/in.svg"
    },
    {
      code: "pt-BR",
      name: "Portuguese",
      country: "Brazil",
      flag: "https://flagcdn.com/br.svg"
    },
    {
      code: "ko-KR",
      name: "Korean",
      country: "South Korea",
      flag: "https://flagcdn.com/kr.svg"
    },
    {
      code: "tr-TR",
      name: "Turkish",
      country: "Turkey",
      flag: "https://flagcdn.com/tr.svg"
    },
    {
      code: "vi-VN",
      name: "Vietnamese",
      country: "Vietnam",
      flag: "https://flagcdn.com/vn.svg"
    },
    {
      code: "th-TH",
      name: "Thai",
      country: "Thailand",
      flag: "https://flagcdn.com/th.svg"
    }
  ];
}

// Speech recognition function using the server API
export async function recognizeSpeech(
  audioBase64: string,
  languageCode: string
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        audio: audioBase64,
        language: languageCode
      }),
      ...credentialsOption
    });
    
    if (!response.ok) {
      throw new Error(`Speech recognition failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error in speech recognition:', error);
    throw error;
  }
}

// Translate text function
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<{ translation: string; originalText: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/translate`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        text,
        sourceLanguage,
        targetLanguage
      }),
      ...credentialsOption
    });
    
    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error translating text:', error);
    throw error;
  }
}
