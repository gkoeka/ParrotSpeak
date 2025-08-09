/**
 * ParticipantsContext.tsx
 * 
 * Manages two participants (A and B) with their language preferences
 * and automatic speaker detection/routing
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Participant {
  lang: string;
  name?: string;
}

export interface ParticipantsState {
  A: Participant;
  B: Participant;
  lastTurnSpeaker?: 'A' | 'B';
  autoDetectSpeakers: boolean;
}

interface ParticipantsContextValue {
  participants: ParticipantsState;
  updateParticipant: (id: 'A' | 'B', lang: string, name?: string) => void;
  swapParticipants: () => void;
  setLastTurnSpeaker: (speaker: 'A' | 'B') => void;
  setAutoDetectSpeakers: (enabled: boolean) => void;
  resetToDefaults: () => void;
}

const STORAGE_KEY = 'participants_preferences';

const defaultState: ParticipantsState = {
  A: { lang: 'en', name: 'Person A' },
  B: { lang: 'es', name: 'Person B' },
  lastTurnSpeaker: undefined,
  autoDetectSpeakers: true
};

const ParticipantsContext = createContext<ParticipantsContextValue | undefined>(undefined);

export function ParticipantsProvider({ children }: { children: React.ReactNode }) {
  const [participants, setParticipants] = useState<ParticipantsState>(defaultState);

  // Load saved preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  // Save preferences whenever they change
  useEffect(() => {
    savePreferences();
  }, [participants.A.lang, participants.B.lang, participants.autoDetectSpeakers]);

  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setParticipants({
          ...defaultState,
          ...parsed,
          lastTurnSpeaker: undefined // Reset on load
        });
      }
    } catch (error) {
      console.error('Failed to load participant preferences:', error);
    }
  };

  const savePreferences = async () => {
    try {
      // Save everything except lastTurnSpeaker (transient state)
      const toSave = {
        A: participants.A,
        B: participants.B,
        autoDetectSpeakers: participants.autoDetectSpeakers
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save participant preferences:', error);
    }
  };

  const updateParticipant = (id: 'A' | 'B', lang: string, name?: string) => {
    setParticipants(prev => ({
      ...prev,
      [id]: {
        lang,
        name: name || prev[id].name
      }
    }));
  };

  const swapParticipants = () => {
    setParticipants(prev => ({
      ...prev,
      A: prev.B,
      B: prev.A,
      lastTurnSpeaker: prev.lastTurnSpeaker === 'A' ? 'B' : prev.lastTurnSpeaker === 'B' ? 'A' : undefined
    }));
  };

  const setLastTurnSpeaker = (speaker: 'A' | 'B') => {
    setParticipants(prev => ({
      ...prev,
      lastTurnSpeaker: speaker
    }));
  };

  const setAutoDetectSpeakers = (enabled: boolean) => {
    setParticipants(prev => ({
      ...prev,
      autoDetectSpeakers: enabled
    }));
  };

  const resetToDefaults = () => {
    setParticipants(defaultState);
  };

  return (
    <ParticipantsContext.Provider value={{
      participants,
      updateParticipant,
      swapParticipants,
      setLastTurnSpeaker,
      setAutoDetectSpeakers,
      resetToDefaults
    }}>
      {children}
    </ParticipantsContext.Provider>
  );
}

export function useParticipants() {
  const context = useContext(ParticipantsContext);
  if (!context) {
    throw new Error('useParticipants must be used within ParticipantsProvider');
  }
  return context;
}