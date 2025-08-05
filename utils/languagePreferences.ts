import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_PREFERENCES_KEY = '@language_preferences';

export interface LanguagePreferences {
  sourceLanguage: string;
  targetLanguage: string;
  lastUpdated: string;
}

export const LanguagePreferencesStorage = {
  // Save language preferences
  async saveLanguagePreferences(sourceLanguage: string, targetLanguage: string): Promise<void> {
    try {
      const preferences: LanguagePreferences = {
        sourceLanguage,
        targetLanguage,
        lastUpdated: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(LANGUAGE_PREFERENCES_KEY, JSON.stringify(preferences));
      console.log('Language preferences saved:', preferences);
    } catch (error) {
      console.error('Failed to save language preferences:', error);
    }
  },

  // Load language preferences
  async getLanguagePreferences(): Promise<LanguagePreferences | null> {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_PREFERENCES_KEY);
      if (stored) {
        const preferences = JSON.parse(stored) as LanguagePreferences;
        console.log('Language preferences loaded:', preferences);
        return preferences;
      }
      return null;
    } catch (error) {
      console.error('Failed to load language preferences:', error);
      return null;
    }
  },

  // Clear language preferences (useful for testing or when user signs out)
  async clearLanguagePreferences(): Promise<void> {
    try {
      await AsyncStorage.removeItem(LANGUAGE_PREFERENCES_KEY);
      console.log('Language preferences cleared');
    } catch (error) {
      console.error('Failed to clear language preferences:', error);
    }
  },

  // Get default languages if no preferences exist
  getDefaultLanguages(): { sourceLanguage: string; targetLanguage: string } {
    return {
      sourceLanguage: 'en', // Default to English
      targetLanguage: 'es'  // Default to Spanish
    };
  }
};