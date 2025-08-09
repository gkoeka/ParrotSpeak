/**
 * ConversationContext.tsx
 * 
 * Simplified context for conversation management without Conversation Mode
 */

import React, { createContext, useContext, useState } from 'react';

export interface ConversationUIState {
  // Current conversation state
  sourceLanguage: string;
  targetLanguage: string;
  
  // Microphone state
  isMicrophoneActive: boolean;
  isProcessingAudio: boolean;
  
  // Error state
  error: string | null;
}

export interface ConversationActions {
  // Language management
  setLanguages: (source: string, target: string) => void;
  
  // Microphone controls
  setMicrophoneActive: (active: boolean) => void;
  setAudioProcessing: (processing: boolean) => void;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

interface ConversationContextValue {
  state: ConversationUIState;
  actions: ConversationActions;
}

const ConversationContext = createContext<ConversationContextValue | undefined>(undefined);

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [isMicrophoneActive, setMicrophoneActive] = useState(false);
  const [isProcessingAudio, setProcessingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state: ConversationUIState = {
    sourceLanguage,
    targetLanguage,
    isMicrophoneActive,
    isProcessingAudio,
    error
  };

  const actions: ConversationActions = {
    setLanguages: (source: string, target: string) => {
      setSourceLanguage(source);
      setTargetLanguage(target);
    },
    setMicrophoneActive: (active: boolean) => setMicrophoneActive(active),
    setAudioProcessing: (processing: boolean) => setProcessingAudio(processing),
    setError: (error: string | null) => setError(error),
    clearError: () => setError(null)
  };

  return (
    <ConversationContext.Provider value={{ state, actions }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within ConversationProvider');
  }
  return context;
}