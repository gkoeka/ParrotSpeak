// Enhanced language configuration with speech synthesis support
// Based on dual architecture language support with mobile-optimized features

// Comprehensive flag mapping for all supported languages
export const getFlagEmoji = (code: string): string => {
  if (!code) return '🌍';
  
  // Handle language codes with country suffixes (e.g., en-US, de-DE)
  const baseCode = code.split('-')[0].toLowerCase();
  
  const flagMap: { [key: string]: string } = {
    'en': '🇺🇸', 'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪',
    'it': '🇮🇹', 'pt': '🇵🇹', 'ru': '🇷🇺', 'zh': '🇨🇳',
    'ja': '🇯🇵', 'ko': '🇰🇷', 'ar': '🇸🇦', 'hi': '🇮🇳', 'nl': '🇳🇱',
    'sv': '🇸🇪', 'no': '🇳🇴', 'da': '🇩🇰', 'fi': '🇫🇮', 'pl': '🇵🇱',
    'tr': '🇹🇷', 'he': '🇮🇱', 'th': '🇹🇭', 'vi': '🇻🇳', 'uk': '🇺🇦',
    'cs': '🇨🇿', 'sk': '🇸🇰', 'hu': '🇭🇺', 'ro': '🇷🇴', 'bg': '🇧🇬',
    'hr': '🇭🇷', 'sr': '🇷🇸', 'sl': '🇸🇮', 'et': '🇪🇪', 'lv': '🇱🇻',
    'lt': '🇱🇹', 'mt': '🇲🇹', 'ga': '🇮🇪', 'cy': '🏴󠁧󠁢󠁷󠁬󠁳󞁿', 'is': '🇮🇸',
    'mk': '🇲🇰', 'sq': '🇦🇱', 'eu': '🏴󠁥󠁳󠁰󠁶󞁿', 'ca': '🏴󠁥󠁳󠁣󠁴󞁿', 'gl': '🏴󠁥󠁳󠁧󠁡󞁿',
    'af': '🇿🇦', 'sw': '🇰🇪', 'zu': '🇿🇦', 'xh': '🇿🇦', 'yo': '🇳🇬',
    'ig': '🇳🇬', 'ha': '🇳🇬', 'am': '🇪🇹', 'or': '🇮🇳', 'as': '🇮🇳',
    'bn': '🇧🇩', 'gu': '🇮🇳', 'kn': '🇮🇳', 'ml': '🇮🇳', 'mr': '🇮🇳',
    'ne': '🇳🇵', 'pa': '🇮🇳', 'si': '🇱🇰', 'ta': '🇮🇳', 'te': '🇮🇳',
    'ur': '🇵🇰', 'fil': '🇵🇭', 'yue': '🇭🇰', 'kk': '🇰🇿', 'uz': '🇺🇿',
    'az': '🇦🇿', 'id': '🇮🇩', 'ms': '🇲🇾', 'sher': '🇳🇵', 'dz': '🇧🇹', 
    'hy': '🇦🇲', 'ka': '🇬🇪', 'mn': '🇲🇳'
  };
  
  // Special handling for specific language-country combinations
  if (code === 'es-ES') return '🇪🇸'; // Spain Spanish
  if (code === 'es-419' || code === 'es-MX') return '🇲🇽'; // Latin American Spanish
  if (code === 'pt-BR') return '🇧🇷'; // Brazilian Portuguese
  if (code === 'pt-PT') return '🇵🇹'; // European Portuguese
  if (code === 'zh-CN') return '🇨🇳'; // Simplified Chinese
  if (code === 'zh-TW') return '🇹🇼'; // Traditional Chinese
  
  // Handle generic Spanish
  if (baseCode === 'es') {
    return '🇲🇽'; // Default to Mexico flag for generic Spanish
  }
  
  return flagMap[baseCode] || '🌍';
};

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
    code: "sl",
    name: "Slovenian",
    nativeName: "Slovenščina",
    country: "Slovenia",
    flag: "https://flagcdn.com/si.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 3
  },
  {
    code: "is",
    name: "Icelandic",
    nativeName: "Íslenska",
    country: "Iceland",
    flag: "https://flagcdn.com/is.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 3
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
    code: "fil",
    name: "Filipino",
    nativeName: "Wikang Filipino",
    country: "Philippines",
    flag: "https://flagcdn.com/ph.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 6
  },
  {
    code: "yue",
    name: "Cantonese",
    nativeName: "廣東話",
    country: "Hong Kong",
    flag: "https://flagcdn.com/hk.svg",
    speechSupported: true,
    speechToTextSupported: true,
    textToSpeechSupported: true,
    voiceGender: 'neutral',
    translationQuality: 'medium',
    popularity: 6
  },
  {
    code: "kk",
    name: "Kazakh",
    nativeName: "Қазақ тілі",
    country: "Kazakhstan",
    flag: "https://flagcdn.com/kz.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 3
  },
  {
    code: "uz",
    name: "Uzbek",
    nativeName: "Oʻzbek tili",
    country: "Uzbekistan",
    flag: "https://flagcdn.com/uz.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 3
  },
  {
    code: "az",
    name: "Azerbaijani",
    nativeName: "Azərbaycan dili",
    country: "Azerbaijan",
    flag: "https://flagcdn.com/az.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 3
  },
  {
    code: "si",
    name: "Sinhala",
    nativeName: "සිංහල",
    country: "Sri Lanka",
    flag: "https://flagcdn.com/lk.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 3
  },
  {
    code: "mt",
    name: "Maltese",
    nativeName: "Malti",
    country: "Malta",
    flag: "https://flagcdn.com/mt.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 2
  },
  {
    code: "sq",
    name: "Albanian",
    nativeName: "Shqip",
    country: "Albania",
    flag: "https://flagcdn.com/al.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 3
  },
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
  },
  {
    code: "sher",
    name: "Sherpa",
    nativeName: "ཤར་པ་ཁ",
    country: "Nepal",
    flag: "https://flagcdn.com/np.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 1
  },
  {
    code: "dz",
    name: "Bhutanese (Dzongkha)",
    nativeName: "རྫོང་ཁ",
    country: "Bhutan",
    flag: "https://flagcdn.com/bt.svg",
    speechSupported: false,
    speechToTextSupported: false,
    textToSpeechSupported: false,
    translationQuality: 'basic',
    popularity: 1
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