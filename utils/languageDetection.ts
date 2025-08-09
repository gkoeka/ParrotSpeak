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
  
  // Exact match after normalization
  if (detected === target) return true;
  
  // Handle regional variants more generically
  // e.g., 'pt-BR' matches 'pt', 'pt' matches 'pt-BR'
  const detectedBase = detectedLang.split('-')[0].toLowerCase();
  const targetBase = targetLang.split('-')[0].toLowerCase();
  
  // Normalize both to base and compare
  const normalizedDetectedBase = normalizeLanguageCode(detectedBase);
  const normalizedTargetBase = normalizeLanguageCode(targetBase);
  
  if (normalizedDetectedBase === normalizedTargetBase) {
    return true;
  }
  
  // Special case for Spanish variants
  if ((detected === 'es' || detected === 'spa') && 
      (target === 'es' || target === 'spa')) {
    return true;
  }
  
  // Special case for Portuguese variants  
  if ((detected === 'pt' || detected === 'por') &&
      (target === 'pt' || target === 'por')) {
    return true;
  }
  
  // Special case for Chinese variants
  if ((detected === 'zh' || detected === 'zho') &&
      (target === 'zh' || target === 'zho')) {
    return true;
  }
  
  return false;
}

/**
 * Normalize language code for routing (preserves regional for TTS)
 * Maps regional codes to base for matching (e.g., 'pt-BR' → 'pt')
 */
export function normalizeLang(code: string): string {
  return normalizeLanguageCode(code);
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
  // Log raw and normalized values for debugging
  const normalizedDetected = normalizeLang(detectedLang);
  const normalizedA = normalizeLang(participantA.lang);
  const normalizedB = normalizeLang(participantB.lang);
  
  console.log(`🔍 Language Detection:
    detectedLang: ${detectedLang}
    normalizedLang: ${normalizedDetected}
    participant A: ${participantA.lang} (normalized: ${normalizedA})
    participant B: ${participantB.lang} (normalized: ${normalizedB})`);
  
  // Check if detected language matches participant A
  if (isCloseMatch(detectedLang, participantA.lang)) {
    console.log(`    chosenSpeaker: A`);
    return 'A';
  }
  
  // Check if detected language matches participant B
  if (isCloseMatch(detectedLang, participantB.lang)) {
    console.log(`    chosenSpeaker: B`);
    return 'B';
  }
  
  // If no match, alternate from last speaker
  // Default to 'A' if no last speaker
  const fallbackSpeaker = lastSpeaker === 'A' ? 'B' : 'A';
  console.log(`    chosenSpeaker: ${fallbackSpeaker} (fallback)`);
  return fallbackSpeaker;
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