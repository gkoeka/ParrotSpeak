// Enhanced language configuration with speech synthesis support
// Based on dual architecture language support with mobile-optimized features

export interface LanguageConfiguration {
  code: string;
  name: string;
  nativeName: string;
  country: string;
  flag: string;
  
  // Speech synthesis support
  speechSupported: boolean;
  speechToTextSupported: boolean;
  textToSpeechSupported: boolean;
  
  // Voice configuration
  voiceGender?: 'male' | 'female' | 'neutral';
  voiceType?: string; // Platform-specific voice identifier
  
  // Quality indicators
  translationQuality: 'high' | 'medium' | 'basic';
  popularity: number; // 1-10 scale for sorting
}

// Comprehensive language configuration with speech synthesis support
export const LANGUAGE_CONFIGURATIONS: LanguageConfiguration[] = [
  // Tier 1: High-quality languages with full speech support
  {
    code: "en",
    name: "English",
    nativeName: "English",
    country: "United States",
    flag: "https://flagcdn.com/us.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'high',
    popularity: 10
  },
  {
    code: "es-ES",
    name: "Spanish (Spain)",
    nativeName: "Español (España)",
    country: "Spain",
    flag: "https://flagcdn.com/es.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'high',
    popularity: 9
  },
  {
    code: "es-419",
    name: "Spanish (Latin America)",
    nativeName: "Español (Latinoamérica)",
    country: "Latin America",
    flag: "https://flagcdn.com/mx.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'high',
    popularity: 9
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    country: "France",
    flag: "https://flagcdn.com/fr.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'high',
    popularity: 8
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    country: "Germany",
    flag: "https://flagcdn.com/de.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'high',
    popularity: 7
  },
  {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    country: "Italy",
    flag: "https://flagcdn.com/it.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'high',
    popularity: 6
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    country: "Brazil",
    flag: "https://flagcdn.com/br.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'high',
    popularity: 6
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    country: "Japan",
    flag: "https://flagcdn.com/jp.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'high',
    popularity: 8
  },
  {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    country: "South Korea",
    flag: "https://flagcdn.com/kr.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'high',
    popularity: 7
  },
  {
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    country: "China",
    flag: "https://flagcdn.com/cn.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'high',
    popularity: 9
  },
  {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    country: "Russia",
    flag: "https://flagcdn.com/ru.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'high',
    popularity: 7
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    country: "Saudi Arabia",
    flag: "https://flagcdn.com/sa.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'high',
    popularity: 8
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    country: "India",
    flag: "https://flagcdn.com/in.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'high',
    popularity: 8
  },

  // Tier 2: Good quality languages with most speech support
  {
    code: "nl",
    name: "Dutch",
    nativeName: "Nederlands",
    country: "Netherlands",
    flag: "https://flagcdn.com/nl.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'high',
    popularity: 5
  },
  {
    code: "pl",
    name: "Polish",
    nativeName: "Polski",
    country: "Poland",
    flag: "https://flagcdn.com/pl.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 5
  },
  {
    code: "tr",
    name: "Turkish",
    nativeName: "Türkçe",
    country: "Turkey",
    flag: "https://flagcdn.com/tr.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 5
  },
  {
    code: "sv",
    name: "Swedish",
    nativeName: "Svenska",
    country: "Sweden",
    flag: "https://flagcdn.com/se.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 4
  },
  {
    code: "no",
    name: "Norwegian",
    nativeName: "Norsk",
    country: "Norway",
    flag: "https://flagcdn.com/no.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 4
  },
  {
    code: "da",
    name: "Danish",
    nativeName: "Dansk",
    country: "Denmark",
    flag: "https://flagcdn.com/dk.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 4
  },
  {
    code: "fi",
    name: "Finnish",
    nativeName: "Suomi",
    country: "Finland",
    flag: "https://flagcdn.com/fi.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 4
  },
  {
    code: "th",
    name: "Thai",
    nativeName: "ไทย",
    country: "Thailand",
    flag: "https://flagcdn.com/th.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 5
  },
  {
    code: "vi",
    name: "Vietnamese",
    nativeName: "Tiếng Việt",
    country: "Vietnam",
    flag: "https://flagcdn.com/vn.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 5
  },
  {
    code: "id",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    country: "Indonesia",
    flag: "https://flagcdn.com/id.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 5
  },
  {
    code: "ms",
    name: "Malay",
    nativeName: "Bahasa Melayu",
    country: "Malaysia",
    flag: "https://flagcdn.com/my.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 4
  },

  // Tier 3: European languages with good support
  {
    code: "cs",
    name: "Czech",
    nativeName: "Čeština",
    country: "Czech Republic",
    flag: "https://flagcdn.com/cz.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 4
  },
  {
    code: "el",
    name: "Greek",
    nativeName: "Ελληνικά",
    country: "Greece",
    flag: "https://flagcdn.com/gr.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 4
  },
  {
    code: "he",
    name: "Hebrew",
    nativeName: "עברית",
    country: "Israel",
    flag: "https://flagcdn.com/il.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 4
  },
  {
    code: "hu",
    name: "Hungarian",
    nativeName: "Magyar",
    country: "Hungary",
    flag: "https://flagcdn.com/hu.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 4
  },
  {
    code: "ro",
    name: "Romanian",
    nativeName: "Română",
    country: "Romania",
    flag: "https://flagcdn.com/ro.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 4
  },
  {
    code: "sk",
    name: "Slovak",
    nativeName: "Slovenčina",
    country: "Slovakia",
    flag: "https://flagcdn.com/sk.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 3
  },
  {
    code: "uk",
    name: "Ukrainian",
    nativeName: "Українська",
    country: "Ukraine",
    flag: "https://flagcdn.com/ua.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 5
  },
  {
    code: "hr",
    name: "Croatian",
    nativeName: "Hrvatski",
    country: "Croatia",
    flag: "https://flagcdn.com/hr.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 3
  },
  {
    code: "sr",
    name: "Serbian",
    nativeName: "Српски",
    country: "Serbia",
    flag: "https://flagcdn.com/rs.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 3
  },
  {
    code: "bg",
    name: "Bulgarian",
    nativeName: "Български",
    country: "Bulgaria",
    flag: "https://flagcdn.com/bg.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 3
  },
  {
    code: "lt",
    name: "Lithuanian",
    nativeName: "Lietuvių",
    country: "Lithuania",
    flag: "https://flagcdn.com/lt.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 3
  },
  {
    code: "lv",
    name: "Latvian",
    nativeName: "Latviešu",
    country: "Latvia",
    flag: "https://flagcdn.com/lv.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 3
  },
  {
    code: "et",
    name: "Estonian",
    nativeName: "Eesti",
    country: "Estonia",
    flag: "https://flagcdn.com/ee.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 3
  },

  // Tier 4: Additional Indian subcontinent languages
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    country: "Bangladesh",
    flag: "https://flagcdn.com/bd.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 6
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    country: "India",
    flag: "https://flagcdn.com/in.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 4
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    country: "India",
    flag: "https://flagcdn.com/in.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 4
  },
  {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    country: "Pakistan",
    flag: "https://flagcdn.com/pk.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 4
  },
  {
    code: "fa",
    name: "Persian",
    nativeName: "فارسی",
    country: "Iran",
    flag: "https://flagcdn.com/ir.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 4
  },

  // Tier 5: Basic support languages
  {
    code: "af",
    name: "Afrikaans",
    nativeName: "Afrikaans",
    country: "South Africa",
    flag: "https://flagcdn.com/za.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 2
  },
  {
    code: "sw",
    name: "Swahili",
    nativeName: "Kiswahili",
    country: "Kenya",
    flag: "https://flagcdn.com/ke.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 3
  },
  {
    code: "am",
    name: "Amharic",
    nativeName: "አማርኛ",
    country: "Ethiopia",
    flag: "https://flagcdn.com/et.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 2
  },
  {
    code: "km",
    name: "Khmer",
    nativeName: "ខ្មែរ",
    country: "Cambodia",
    flag: "https://flagcdn.com/kh.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 2
  },
  {
    code: "lo",
    name: "Lao",
    nativeName: "ລາວ",
    country: "Laos",
    flag: "https://flagcdn.com/la.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 2
  },
  {
    code: "my",
    name: "Myanmar",
    nativeName: "မြန်မာ",
    country: "Myanmar",
    flag: "https://flagcdn.com/mm.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 2
  },
  {
    code: "ne",
    name: "Nepali",
    nativeName: "नेपाली",
    country: "Nepal",
    flag: "https://flagcdn.com/np.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 2
  },
  {
    code: "ka",
    name: "Georgian",
    nativeName: "ქართული",
    country: "Georgia",
    flag: "https://flagcdn.com/ge.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 2
  },
  {
    code: "hy",
    name: "Armenian",
    nativeName: "Հայերեն",
    country: "Armenia",
    flag: "https://flagcdn.com/am.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 2
  },
  {
    code: "mn",
    name: "Mongolian",
    nativeName: "Монгол",
    country: "Mongolia",
    flag: "https://flagcdn.com/mn.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 2
  },
  {
    code: "cy",
    name: "Welsh",
    nativeName: "Cymraeg",
    country: "Wales",
    flag: "https://flagcdn.com/gb-wls.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 2
  }
];

// Helper functions for language configuration
export function getLanguageByCode(code: string): LanguageConfiguration | undefined {
  return LANGUAGE_CONFIGURATIONS.find(lang => 
    lang.code === code || lang.code === code.split('-')[0]
  );
}

export function getSupportedLanguages(): LanguageConfiguration[] {
  return LANGUAGE_CONFIGURATIONS.sort((a, b) => b.popularity - a.popularity);
}

export function getLanguagesWithSpeechSupport(): LanguageConfiguration[] {
  return LANGUAGE_CONFIGURATIONS.filter(lang => lang.speechSupported)
    .sort((a, b) => b.popularity - a.popularity);
}

export function getLanguagesWithoutSpeechSupport(): LanguageConfiguration[] {
  return LANGUAGE_CONFIGURATIONS.filter(lang => !lang.speechSupported)
    .sort((a, b) => b.popularity - a.popularity);
}

// Speech fallback configuration
export const SPEECH_FALLBACK_ORDER = ['en', 'es-419', 'es-ES', 'fr', 'de', 'it'];

export function getSpeechFallbackLanguage(requestedLanguage: string): string {
  const language = getLanguageByCode(requestedLanguage);
  
  if (language?.speechSupported) {
    return requestedLanguage;
  }
  
  // Return first available fallback language
  return SPEECH_FALLBACK_ORDER[0];
}