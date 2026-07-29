import type { LanguageConfiguration } from '../constants/languageConfiguration';

// Minimal emergency fallback used only when the full LANGUAGE_CONFIGURATIONS
// list can't be loaded (server: dynamic import failure; client: network failure).
// Entries are copied verbatim from constants/languageConfiguration.ts's en/es-ES/fr/de
// records — keep these in sync manually if those four entries ever change there,
// so the fallback path never hands out a language code the rest of the app doesn't recognize.
export const FALLBACK_LANGUAGES: LanguageConfiguration[] = [
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
  }
];
