// Types for speech configuration and voice profiles

/**
 * Represents a voice profile configuration for text-to-speech
 */
export interface VoiceProfile {
  id: string;
  name: string;
  languageCode: string;
  pitch: number;  // Range: 0.5 to 2.0, default 1.0
  rate: number;   // Range: 0.5 to 2.0, default 1.0
  voiceType?: string; // Voice type identifier, if available
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating a new voice profile
 */
export interface CreateVoiceProfileInput {
  userId?: number;
  name: string;
  languageCode: string;
  pitch: number;
  rate: number;
  voiceType?: string;
  isDefault?: boolean;
}

/**
 * Input for updating an existing voice profile
 */
export interface UpdateVoiceProfileInput {
  name?: string;
  languageCode?: string;
  pitch?: number;
  rate?: number;
  voiceType?: string;
  isDefault?: boolean;
}

/**
 * Settings for text-to-speech playback
 */
export interface SpeechSettings {
  autoPlay: boolean; // Whether to automatically play translations
  useProfileForLanguage: boolean; // Whether to use language-specific profiles
  defaultProfileId?: string; // Default profile to use if no language-specific profile
}
