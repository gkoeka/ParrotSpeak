/**
 * Language detection and matching utilities
 */

/**
 * Map ISO-639-3 codes to ISO-639-1 codes
 * Whisper often returns ISO-639-3 codes
 */
const ISO_639_3_TO_1: { [key: string]: string } = {
  'eng': 'en',
  'spa': 'es', 
  'fra': 'fr',
  'deu': 'de',
  'ita': 'it',
  'por': 'pt',
  'rus': 'ru',
  'zho': 'zh',
  'jpn': 'ja',
  'kor': 'ko',
  'ara': 'ar',
  'hin': 'hi',
  'nld': 'nl',
  'swe': 'sv',
  'nor': 'no',
  'dan': 'da',
  'fin': 'fi',
  'pol': 'pl',
  'tur': 'tr',
  'heb': 'he',
  'tha': 'th',
  'vie': 'vi',
  'ukr': 'uk',
  'ces': 'cs',
  'slk': 'sk',
  'hun': 'hu',
  'ron': 'ro',
  'bul': 'bg',
  'hrv': 'hr',
  'srp': 'sr',
  'slv': 'sl',
  'est': 'et',
  'lav': 'lv',
  'lit': 'lt',
  'mlt': 'mt',
  'gle': 'ga',
  'cym': 'cy',
  'isl': 'is',
  'mkd': 'mk',
  'sqi': 'sq',
  'eus': 'eu',
  'cat': 'ca',
  'glg': 'gl'
};

/**
 * Normalize language code to ISO-639-1 format
 */
export function normalizeLanguageCode(code: string): string {
  if (!code) return '';
  
  // Already ISO-639-1 (2 chars)
  if (code.length === 2) {
    return code.toLowerCase();
  }
  
  // ISO-639-3 (3 chars)
  if (code.length === 3) {
    const normalized = ISO_639_3_TO_1[code.toLowerCase()];
    if (normalized) return normalized;
    // Try to extract first 2 chars as fallback
    return code.substring(0, 2).toLowerCase();
  }
  
  // Has region code (e.g., 'en-US', 'es-419')
  if (code.includes('-') || code.includes('_')) {
    const parts = code.split(/[-_]/);
    return normalizeLanguageCode(parts[0]);
  }
  
  return code.toLowerCase();
}

/**
 * Check if two language codes match (considering variants)
 */
export function isCloseMatch(detectedLang: string, targetLang: string): boolean {
  const detected = normalizeLanguageCode(detectedLang);
  const target = normalizeLanguageCode(targetLang);
  
  // Exact match
  if (detected === target) return true;
  
  // Both are variants of same language
  if (target.includes('-') && detected === target.split('-')[0]) return true;
  if (detected.includes('-') && target === detected.split('-')[0]) return true;
  
  // Special case for Spanish variants
  if ((detected === 'es' || detected === 'spa') && 
      (target === 'es' || target === 'es-ES' || target === 'es-419')) {
    return true;
  }
  
  // Special case for Portuguese variants  
  if ((detected === 'pt' || detected === 'por') &&
      (target === 'pt' || target === 'pt-BR' || target === 'pt-PT')) {
    return true;
  }
  
  // Special case for Chinese variants
  if ((detected === 'zh' || detected === 'zho') &&
      (target === 'zh' || target.startsWith('zh-'))) {
    return true;
  }
  
  return false;
}

/**
 * Determine which participant is speaking based on detected language
 */
export function determineSpeaker(
  detectedLang: string,
  participantA: { lang: string },
  participantB: { lang: string },
  lastSpeaker?: 'A' | 'B'
): 'A' | 'B' {
  // Check if detected language matches participant A
  if (isCloseMatch(detectedLang, participantA.lang)) {
    return 'A';
  }
  
  // Check if detected language matches participant B
  if (isCloseMatch(detectedLang, participantB.lang)) {
    return 'B';
  }
  
  // If no match, alternate from last speaker
  // Default to 'A' if no last speaker
  return lastSpeaker === 'A' ? 'B' : 'A';
}

/**
 * Get target language based on speaker
 */
export function getTargetLanguage(
  speaker: 'A' | 'B',
  participantA: { lang: string },
  participantB: { lang: string }
): string {
  return speaker === 'A' ? participantB.lang : participantA.lang;
}