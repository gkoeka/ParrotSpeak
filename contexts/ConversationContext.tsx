/**
 * ConversationContext.tsx
 * 
 * Purpose: Stores global app state for conversation management including speaker status,
 * microphone on/off state, detected languages, and always listening mode. This context
 * provides centralized state management for the conversation flow across all components.
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import AlwaysListeningService, { 
  ConversationState, 
  SpeakerRole, 
  AlwaysListeningCallbacks,
  ConversationTurn 
} from '../services/AlwaysListeningService';

export interface ConversationUIState {
  // Always listening mode state
  isAlwaysListeningEnabled: boolean;
  isAlwaysListeningActive: boolean;
  
  // Current conversation state
  conversationState: ConversationState;
  currentSpeaker: SpeakerRole;
  
  // Phase 1: Microphone and audio state
  isListening: boolean;                  // VoiceActivityService listening state
  isMicrophoneActive: boolean;           // Mic permission and activity
  isProcessingAudio: boolean;
  audioLevel: number;                    // Current audio input level (0-100)
  micPermissionGranted: boolean;         // Permission status
  
  // Language detection state
  detectedLanguage: string | null;
  languageConfidence: number;
  sourceLanguage: string;
  targetLanguage: string;
  
  // Speaker tracking
  speakerSwitchCount: number;
  lastSpeakerSwitchTime: Date | null;
  
  // Visual indicators
  showLanguageDetection: boolean;
  showSpeakerIndicator: boolean;
  showMicrophoneStatus: boolean;
  
  // Error state
  error: string | null;
  lastErrorTime: Date | null;
}

export interface ConversationActions {
  // Always listening controls
  enableAlwaysListening: () => void;
  disableAlwaysListening: () => void;
  toggleAlwaysListening: () => void;
  
  // Phase 1: VoiceActivityService controls
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  setListening: (listening: boolean) => void;
  setMicPermission: (granted: boolean) => void;
  
  // Conversation state management
  setConversationState: (state: ConversationState) => void;
  setSpeaker: (speaker: SpeakerRole) => void;
  switchSpeaker: () => void;
  
  // Microphone controls
  setMicrophoneActive: (active: boolean) => void;
  setAudioProcessing: (processing: boolean) => void;
  updateAudioLevel: (level: number) => void;
  
  // Language management
  setLanguages: (source: string, target: string) => void;
  setDetectedLanguage: (language: string, confidence: number) => void;
  clearDetectedLanguage: () => void;
  
  // UI state controls
  setShowLanguageDetection: (show: boolean) => void;
  setShowSpeakerIndicator: (show: boolean) => void;
  setShowMicrophoneStatus: (show: boolean) => void;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Reset functions
  resetConversationState: () => void;
  resetSpeakerTracking: () => void;
}

export interface ConversationContextType {
  state: ConversationUIState;
  actions: ConversationActions;
}

// Action types for reducer
type ConversationActionType =
  | { type: 'ENABLE_ALWAYS_LISTENING' }
  | { type: 'DISABLE_ALWAYS_LISTENING' }
  | { type: 'SET_LISTENING'; payload: boolean }
  | { type: 'SET_MIC_PERMISSION'; payload: boolean }
  | { type: 'SET_CONVERSATION_STATE'; payload: ConversationState }
  | { type: 'SET_SPEAKER'; payload: SpeakerRole }
  | { type: 'SWITCH_SPEAKER' }
  | { type: 'SET_MICROPHONE_ACTIVE'; payload: boolean }
  | { type: 'SET_AUDIO_PROCESSING'; payload: boolean }
  | { type: 'UPDATE_AUDIO_LEVEL'; payload: number }
  | { type: 'SET_LANGUAGES'; payload: { source: string; target: string } }
  | { type: 'SET_DETECTED_LANGUAGE'; payload: { language: string; confidence: number } }
  | { type: 'CLEAR_DETECTED_LANGUAGE' }
  | { type: 'SET_SHOW_LANGUAGE_DETECTION'; payload: boolean }
  | { type: 'SET_SHOW_SPEAKER_INDICATOR'; payload: boolean }
  | { type: 'SET_SHOW_MICROPHONE_STATUS'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_CONVERSATION_STATE' }
  | { type: 'RESET_SPEAKER_TRACKING' };

// Initial state
const initialState: ConversationUIState = {
  isAlwaysListeningEnabled: false,
  isAlwaysListeningActive: false,
  conversationState: ConversationState.IDLE,
  currentSpeaker: SpeakerRole.SOURCE,
  isListening: false,
  isMicrophoneActive: false,
  isProcessingAudio: false,
  audioLevel: 0,
  micPermissionGranted: false,
  detectedLanguage: null,
  languageConfidence: 0,
  sourceLanguage: 'en',
  targetLanguage: 'es',
  speakerSwitchCount: 0,
  lastSpeakerSwitchTime: null,
  showLanguageDetection: true,
  showSpeakerIndicator: true,
  showMicrophoneStatus: true,
  error: null,
  lastErrorTime: null,
};

/**
 * Reducer function for conversation state management
 * TODO: Phase 2 - Implement all state transitions and logic
 */
function conversationReducer(
  state: ConversationUIState,
  action: ConversationActionType
): ConversationUIState {
  switch (action.type) {
    case 'ENABLE_ALWAYS_LISTENING':
      // TODO: Phase 2 - Enable always listening mode
      return {
        ...state,
        isAlwaysListeningEnabled: true,
        error: null,
      };

    case 'DISABLE_ALWAYS_LISTENING':
      // TODO: Phase 2 - Disable always listening mode and reset state
      return {
        ...state,
        isAlwaysListeningEnabled: false,
        isAlwaysListeningActive: false,
        conversationState: ConversationState.IDLE,
        isListening: false,
        isMicrophoneActive: false,
        isProcessingAudio: false,
        audioLevel: 0,
      };

    case 'SET_LISTENING':
      // Phase 1 - Update VoiceActivityService listening state
      return {
        ...state,
        isListening: action.payload,
        isAlwaysListeningActive: action.payload && state.isAlwaysListeningEnabled,
      };

    case 'SET_MIC_PERMISSION':
      // Phase 1 - Update microphone permission status
      return {
        ...state,
        micPermissionGranted: action.payload,
      };

    case 'SET_CONVERSATION_STATE':
      // TODO: Phase 2 - Update conversation state with validation
      return {
        ...state,
        conversationState: action.payload,
      };

    case 'SET_SPEAKER':
      // TODO: Phase 2 - Set current speaker with tracking
      return {
        ...state,
        currentSpeaker: action.payload,
      };

    case 'SWITCH_SPEAKER':
      // TODO: Phase 2 - Switch between speakers with tracking
      return {
        ...state,
        currentSpeaker: state.currentSpeaker === SpeakerRole.SOURCE 
          ? SpeakerRole.TARGET 
          : SpeakerRole.SOURCE,
        speakerSwitchCount: state.speakerSwitchCount + 1,
        lastSpeakerSwitchTime: new Date(),
      };

    case 'SET_MICROPHONE_ACTIVE':
      // TODO: Phase 1 - Update microphone status
      return {
        ...state,
        isMicrophoneActive: action.payload,
      };

    case 'SET_AUDIO_PROCESSING':
      // TODO: Phase 1 - Update audio processing status
      return {
        ...state,
        isProcessingAudio: action.payload,
      };

    case 'UPDATE_AUDIO_LEVEL':
      // TODO: Phase 1 - Update audio level for visual indicators
      return {
        ...state,
        audioLevel: Math.max(0, Math.min(100, action.payload)),
      };

    case 'SET_LANGUAGES':
      // TODO: Phase 2 - Update conversation languages
      return {
        ...state,
        sourceLanguage: action.payload.source,
        targetLanguage: action.payload.target,
      };

    case 'SET_DETECTED_LANGUAGE':
      // TODO: Phase 2 - Update detected language with confidence
      return {
        ...state,
        detectedLanguage: action.payload.language,
        languageConfidence: action.payload.confidence,
      };

    case 'CLEAR_DETECTED_LANGUAGE':
      // TODO: Phase 2 - Clear language detection state
      return {
        ...state,
        detectedLanguage: null,
        languageConfidence: 0,
      };

    case 'SET_SHOW_LANGUAGE_DETECTION':
      // TODO: Phase 3 - Toggle language detection UI
      return {
        ...state,
        showLanguageDetection: action.payload,
      };

    case 'SET_SHOW_SPEAKER_INDICATOR':
      // TODO: Phase 3 - Toggle speaker indicator UI
      return {
        ...state,
        showSpeakerIndicator: action.payload,
      };

    case 'SET_SHOW_MICROPHONE_STATUS':
      // TODO: Phase 3 - Toggle microphone status UI
      return {
        ...state,
        showMicrophoneStatus: action.payload,
      };

    case 'SET_ERROR':
      // TODO: Phase 1 - Set error state with timestamp
      return {
        ...state,
        error: action.payload,
        lastErrorTime: action.payload ? new Date() : null,
      };

    case 'CLEAR_ERROR':
      // TODO: Phase 1 - Clear error state
      return {
        ...state,
        error: null,
        lastErrorTime: null,
      };

    case 'RESET_CONVERSATION_STATE':
      // TODO: Phase 2 - Reset conversation to initial state
      return {
        ...initialState,
        isAlwaysListeningEnabled: state.isAlwaysListeningEnabled,
        sourceLanguage: state.sourceLanguage,
        targetLanguage: state.targetLanguage,
        micPermissionGranted: state.micPermissionGranted,
      };

    case 'RESET_SPEAKER_TRACKING':
      // TODO: Phase 2 - Reset speaker tracking metrics
      return {
        ...state,
        speakerSwitchCount: 0,
        lastSpeakerSwitchTime: null,
        currentSpeaker: SpeakerRole.SOURCE,
      };

    default:
      return state;
  }
}

// Create context
const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

/**
 * ConversationProvider component
 * TODO: Phase 2 - Integrate with always listening services
 */
export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(conversationReducer, initialState);
  const alwaysListeningServiceRef = useRef<AlwaysListeningService | null>(null);

  // Create action handlers
  const actions: ConversationActions = {
    enableAlwaysListening: useCallback(async () => {
      console.log('🔊 ConversationContext: Enabling always listening...');
      
      // Initialize always listening service if not already created
      if (!alwaysListeningServiceRef.current) {
        console.log('🔧 ConversationContext: Creating AlwaysListeningService instance...');
        const service = new AlwaysListeningService();
        
        // Set up callbacks
        const callbacks: AlwaysListeningCallbacks = {
          onStateChange: (newState: ConversationState, speaker: SpeakerRole) => {
            console.log(`📡 ConversationContext: State changed to ${newState} for ${speaker}`);
            dispatch({ type: 'SET_CONVERSATION_STATE', payload: newState });
            dispatch({ type: 'SET_SPEAKER', payload: speaker });
          },
          onSpeakerSwitch: (from: SpeakerRole, to: SpeakerRole) => {
            console.log(`🔄 ConversationContext: Speaker switched from ${from} to ${to}`);
            dispatch({ type: 'SET_SPEAKER', payload: to });
          },
          onLanguageDetected: (language: string, confidence: number) => {
            console.log(`🌐 ConversationContext: Language detected: ${language} (${confidence})`);
            dispatch({ type: 'SET_DETECTED_LANGUAGE', payload: { language, confidence } });
          },
          onConversationTurn: (turn: ConversationTurn) => {
            console.log(`💬 ConversationContext: New conversation turn from ${turn.speaker}`);
          },
          onError: (error: Error, context: string) => {
            console.error(`❌ ConversationContext: Error in ${context}:`, error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
          }
        };
        
        await service.initialize(callbacks);
        alwaysListeningServiceRef.current = service;
      }
      
      // Start always listening
      if (alwaysListeningServiceRef.current) {
        await alwaysListeningServiceRef.current.startAlwaysListening(
          state.sourceLanguage,
          state.targetLanguage
        );
      }
      
      dispatch({ type: 'ENABLE_ALWAYS_LISTENING' });
    }, [state.sourceLanguage, state.targetLanguage]),

    disableAlwaysListening: useCallback(async () => {
      console.log('🔇 ConversationContext: Disabling always listening...');
      
      if (alwaysListeningServiceRef.current) {
        await alwaysListeningServiceRef.current.stopAlwaysListening();
      }
      
      dispatch({ type: 'DISABLE_ALWAYS_LISTENING' });
    }, []),

    toggleAlwaysListening: useCallback(() => {
      // TODO: Phase 2 - Toggle always listening state
      if (state.isAlwaysListeningEnabled) {
        dispatch({ type: 'DISABLE_ALWAYS_LISTENING' });
      } else {
        dispatch({ type: 'ENABLE_ALWAYS_LISTENING' });
      }
    }, [state.isAlwaysListeningEnabled]),

    // Phase 1: VoiceActivityService controls
    startListening: useCallback(async () => {
      // TODO: Phase 2 - Integrate with VoiceActivityService
      dispatch({ type: 'SET_LISTENING', payload: true });
    }, []),

    stopListening: useCallback(async () => {
      // TODO: Phase 2 - Integrate with VoiceActivityService
      dispatch({ type: 'SET_LISTENING', payload: false });
    }, []),

    setListening: useCallback((listening: boolean) => {
      dispatch({ type: 'SET_LISTENING', payload: listening });
    }, []),

    setMicPermission: useCallback((granted: boolean) => {
      dispatch({ type: 'SET_MIC_PERMISSION', payload: granted });
    }, []),

    setConversationState: useCallback((conversationState: ConversationState) => {
      dispatch({ type: 'SET_CONVERSATION_STATE', payload: conversationState });
    }, []),

    setSpeaker: useCallback((speaker: SpeakerRole) => {
      dispatch({ type: 'SET_SPEAKER', payload: speaker });
    }, []),

    switchSpeaker: useCallback(() => {
      dispatch({ type: 'SWITCH_SPEAKER' });
    }, []),

    setMicrophoneActive: useCallback((active: boolean) => {
      dispatch({ type: 'SET_MICROPHONE_ACTIVE', payload: active });
    }, []),

    setAudioProcessing: useCallback((processing: boolean) => {
      dispatch({ type: 'SET_AUDIO_PROCESSING', payload: processing });
    }, []),

    updateAudioLevel: useCallback((level: number) => {
      dispatch({ type: 'UPDATE_AUDIO_LEVEL', payload: level });
    }, []),

    setLanguages: useCallback((source: string, target: string) => {
      dispatch({ type: 'SET_LANGUAGES', payload: { source, target } });
    }, []),

    setDetectedLanguage: useCallback((language: string, confidence: number) => {
      dispatch({ type: 'SET_DETECTED_LANGUAGE', payload: { language, confidence } });
    }, []),

    clearDetectedLanguage: useCallback(() => {
      dispatch({ type: 'CLEAR_DETECTED_LANGUAGE' });
    }, []),

    setShowLanguageDetection: useCallback((show: boolean) => {
      dispatch({ type: 'SET_SHOW_LANGUAGE_DETECTION', payload: show });
    }, []),

    setShowSpeakerIndicator: useCallback((show: boolean) => {
      dispatch({ type: 'SET_SHOW_SPEAKER_INDICATOR', payload: show });
    }, []),

    setShowMicrophoneStatus: useCallback((show: boolean) => {
      dispatch({ type: 'SET_SHOW_MICROPHONE_STATUS', payload: show });
    }, []),

    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    }, []),

    clearError: useCallback(() => {
      dispatch({ type: 'CLEAR_ERROR' });
    }, []),

    resetConversationState: useCallback(() => {
      dispatch({ type: 'RESET_CONVERSATION_STATE' });
    }, []),

    resetSpeakerTracking: useCallback(() => {
      dispatch({ type: 'RESET_SPEAKER_TRACKING' });
    }, []),
  };

  // TODO: Phase 2 - Add effect to sync with always listening service
  useEffect(() => {
    // TODO: Listen for service state changes
    // TODO: Update context state based on service events
    // TODO: Handle service errors and propagate to UI
  }, [state.isAlwaysListeningEnabled]);

  // TODO: Phase 3 - Add effect for persistence of user preferences
  useEffect(() => {
    // TODO: Save always listening preferences to storage
    // TODO: Load preferences on app start
  }, [state.isAlwaysListeningEnabled]);

  const contextValue: ConversationContextType = {
    state,
    actions,
  };

  return (
    <ConversationContext.Provider value={contextValue}>
      {children}
    </ConversationContext.Provider>
  );
}

/**
 * Hook to use conversation context
 * TODO: Phase 1 - Provide type-safe context access
 */
export function useConversation(): ConversationContextType {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
}

export default ConversationContext;