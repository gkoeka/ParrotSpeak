/**
 * Normalize language codes from various formats to ISO 639-1
 * Handles both Whisper's full language names and ISO codes
 */
export function normalizeLanguageCode(lang: string | undefined): string | undefined {
  if (!lang) return undefined;
  
  const langLower = lang.toLowerCase();
  
  // Map full language names to ISO codes (what Whisper returns)
  const languageMap: { [key: string]: string } = {
    // Common languages
    'english': 'en',
    'spanish': 'es',
    'french': 'fr',
    'german': 'de',
    'italian': 'it',
    'portuguese': 'pt',
    'dutch': 'nl',
    'polish': 'pl',
    'russian': 'ru',
    'chinese': 'zh',
    'japanese': 'ja',
    'korean': 'ko',
    'arabic': 'ar',
    'hindi': 'hi',
    'turkish': 'tr',
    'swedish': 'sv',
    'danish': 'da',
    'norwegian': 'no',
    'finnish': 'fi',
    'greek': 'el',
    'hebrew': 'he',
    'czech': 'cs',
    'hungarian': 'hu',
    'romanian': 'ro',
    'bulgarian': 'bg',
    'croatian': 'hr',
    'serbian': 'sr',
    'slovenian': 'sl',
    'slovak': 'sk',
    'ukrainian': 'uk',
    'vietnamese': 'vi',
    'thai': 'th',
    'indonesian': 'id',
    'malay': 'ms',
    'tagalog': 'tl',
    'swahili': 'sw',
    'afrikaans': 'af',
    'albanian': 'sq',
    'armenian': 'hy',
    'azerbaijani': 'az',
    'basque': 'eu',
    'belarusian': 'be',
    'bengali': 'bn',
    'bosnian': 'bs',
    'catalan': 'ca',
    'estonian': 'et',
    'georgian': 'ka',
    'gujarati': 'gu',
    'haitian creole': 'ht',
    'hausa': 'ha',
    'icelandic': 'is',
    'kannada': 'kn',
    'kazakh': 'kk',
    'latvian': 'lv',
    'lithuanian': 'lt',
    'macedonian': 'mk',
    'malayalam': 'ml',
    'maltese': 'mt',
    'marathi': 'mr',
    'mongolian': 'mn',
    'nepali': 'ne',
    'pashto': 'ps',
    'persian': 'fa',
    'punjabi': 'pa',
    'sinhala': 'si',
    'tamil': 'ta',
    'telugu': 'te',
    'urdu': 'ur',
    'uzbek': 'uz',
    'welsh': 'cy',
    'yiddish': 'yi',
    // Add region-specific if needed
    'en-us': 'en',
    'en-gb': 'en',
    'es-es': 'es',
    'es-mx': 'es',
    'pt-br': 'pt',
    'pt-pt': 'pt',
    'zh-cn': 'zh',
    'zh-tw': 'zh',
  };
  
  // If it's already a 2-letter ISO code, return as-is
  if (langLower.length === 2) {
    return langLower;
  }
  
  // Try to map from full name or locale
  return languageMap[langLower] || lang.split('-')[0].toLowerCase();
}