import { API_BASE_URL } from '../api/config';
import { VoiceProfile } from './speechService';

// Fetch all voice profiles
export async function fetchVoiceProfiles(): Promise<VoiceProfile[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/voice-profiles`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch voice profiles: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching voice profiles:', error);
    return [];
  }
}

// Fetch a specific voice profile by ID
export async function fetchVoiceProfile(id: string): Promise<VoiceProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/voice-profiles/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch voice profile: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching voice profile:', error);
    return null;
  }
}

// Create a new voice profile
export async function createVoiceProfile(profile: Omit<VoiceProfile, 'id'>): Promise<VoiceProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/voice-profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create voice profile: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error creating voice profile:', error);
    return null;
  }
}

// Update an existing voice profile
export async function updateVoiceProfile(id: string, updates: Partial<VoiceProfile>): Promise<VoiceProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/voice-profiles/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update voice profile: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error updating voice profile:', error);
    return null;
  }
}

// Delete a voice profile
export async function deleteVoiceProfile(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/voice-profiles/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete voice profile: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting voice profile:', error);
    return false;
  }
}

// Fetch speech settings
export async function fetchSpeechSettings(): Promise<{
  autoPlay: boolean;
  useProfileForLanguage: boolean;
  defaultProfileId?: string;
} | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/speech-settings`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch speech settings: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching speech settings:', error);
    return null;
  }
}

// Update speech settings
export async function updateSpeechSettings(updates: Partial<{
  autoPlay: boolean;
  useProfileForLanguage: boolean;
  defaultProfileId?: string;
}>): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/speech-settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update speech settings: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating speech settings:', error);
    return false;
  }
}