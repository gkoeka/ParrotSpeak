/**
 * AlwaysListeningService.ts
 * 
 * Purpose: Controls speaker switching logic, turn-taking coordination, and manages
 * the conversation state machine for always listening mode. This service orchestrates
 * the high-level conversation flow, language detection, and speaker transitions.
 */

import VoiceActivityService, { AudioChunk } from './VoiceActivityService';

export enum ConversationState {
  IDLE = 'idle',
  LISTENING_SOURCE = 'listening_source',
  PROCESSING_SOURCE = 'processing_source',
  SPEAKING_TRANSLATION = 'speaking_translation',
  LISTENING_TARGET = 'listening_target', 
  PROCESSING_TARGET = 'processing_target',
  SPEAKING_RESPONSE = 'speaking_response',
  PAUSED = 'paused',
  ERROR = 'error'
}

export enum SpeakerRole {
  SOURCE = 'source',
  TARGET = 'target'
}

export interface ConversationFlowConfig {
  autoLanguageDetection: boolean;
  speakerSwitchTimeout: number;       // ms of silence before switching speakers
  languageConfidenceThreshold: number; // minimum confidence for auto language detection
  maxProcessingTime: number;          // maximum time to process one turn
  enableManualOverride: boolean;      // allow manual speaker switching
}

export interface SpeakerInfo {
  role: SpeakerRole;
  language: string;
  lastSpeechTime: Date | null;
  totalSpeechTime: number;
  messageCount: number;
}

export interface ConversationTurn {
  id: string;
  speaker: SpeakerRole;
  detectedLanguage: string;
  confidence: number;
  audioChunk: AudioChunk;
  timestamp: Date;
}

export interface AlwaysListeningCallbacks {
  onStateChange: (state: ConversationState, speaker: SpeakerRole) => void;
  onSpeakerSwitch: (fromSpeaker: SpeakerRole, toSpeaker: SpeakerRole) => void;
  onLanguageDetected: (language: string, confidence: number) => void;
  onConversationTurn: (turn: ConversationTurn) => void;
  onError: (error: Error, context: string) => void;
  onSilenceDetected?: (duration: number) => void;
  onChunkReceived?: (chunk: AudioChunk) => void;
  onStateChanged?: (state: ConversationState) => void;
}

export class AlwaysListeningService {
  private voiceActivityService: VoiceActivityService;
  private currentState: ConversationState = ConversationState.IDLE;
  private currentSpeaker: SpeakerRole = SpeakerRole.SOURCE;
  private config: ConversationFlowConfig;
  private callbacks: AlwaysListeningCallbacks | null = null;
  private sourceLanguage: string = 'en';
  private targetLanguage: string = 'es';
  private speakerInfo: Map<SpeakerRole, SpeakerInfo> = new Map();
  private conversationTurns: ConversationTurn[] = [];
  private switchTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<ConversationFlowConfig>) {
    this.config = {
      autoLanguageDetection: true,
      speakerSwitchTimeout: 3000,        // 3 seconds
      languageConfidenceThreshold: 0.8,
      maxProcessingTime: 10000,          // 10 seconds
      enableManualOverride: true,
      ...config
    };

    // Initialize speaker info
    this.initializeSpeakerInfo();
    
    // Create voice activity service
    this.voiceActivityService = new VoiceActivityService();
  }

  /**
   * Initialize the always listening service
   * Phase 2 - Set up service dependencies and state
   * @param callbacks Event handlers for conversation flow
   */
  public async initialize(callbacks: AlwaysListeningCallbacks): Promise<void> {
    console.log('🚀 AlwaysListeningService: Initializing...');
    
    this.callbacks = callbacks;
    
    // Initialize voice activity service with our callbacks
    await this.voiceActivityService.initialize({
      onSpeechStart: () => this.handleSpeechStart(),
      onSpeechEnd: (chunk: AudioChunk) => this.handleSpeechChunk(chunk),
      onSilenceDetected: (duration: number) => this.handleSilenceDetected(duration),
      onError: (error: Error) => this.handleError(error)
    });
    
    console.log('✅ AlwaysListeningService: Initialization complete');
  }

  /**
   * Start always listening mode
   * Phase 2 - Begin conversation flow management
   * @param sourceLanguage Primary speaker's language
   * @param targetLanguage Secondary speaker's language
   */
  public async startAlwaysListening(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<void> {
    console.log(`🎤 AlwaysListeningService: Starting conversation loop (${sourceLanguage} ↔ ${targetLanguage})`);
    
    // Set conversation languages
    this.sourceLanguage = sourceLanguage;
    this.targetLanguage = targetLanguage;
    
    // Reset conversation state
    this.currentState = ConversationState.LISTENING_SOURCE;
    this.currentSpeaker = SpeakerRole.SOURCE;
    this.conversationTurns = [];
    
    // Update speaker info with languages
    const sourceInfo = this.speakerInfo.get(SpeakerRole.SOURCE);
    const targetInfo = this.speakerInfo.get(SpeakerRole.TARGET);
    if (sourceInfo) sourceInfo.language = sourceLanguage;
    if (targetInfo) targetInfo.language = targetLanguage;
    
    // Notify state change
    this.updateConversationState(ConversationState.LISTENING_SOURCE);
    
    // Start voice activity detection
    await this.startConversationLoop();
  }

  /**
   * Stop always listening mode
   * Phase 2 - Clean shutdown of conversation flow
   */
  public async stopAlwaysListening(): Promise<void> {
    console.log('🛑 AlwaysListeningService: Stopping conversation loop');
    
    // Stop voice activity service
    await this.voiceActivityService.stopListening();
    
    // Clear all timers
    if (this.switchTimer) {
      clearTimeout(this.switchTimer);
      this.switchTimer = null;
    }
    
    // Update state to idle
    this.updateConversationState(ConversationState.IDLE);
    this.currentSpeaker = SpeakerRole.SOURCE;
    
    console.log(`📊 AlwaysListeningService: Conversation ended with ${this.conversationTurns.length} turns`);
  }

  /**
   * Start the conversation loop
   * Phase 2 - Begin listening for speech
   */
  private async startConversationLoop(): Promise<void> {
    console.log('🔄 AlwaysListeningService: Starting conversation loop');
    await this.voiceActivityService.startListening();
  }

  /**
   * Handle speech start event
   * Phase 2 - Track when speech begins
   */
  private handleSpeechStart(): void {
    console.log(`🗣️ AlwaysListeningService: Speech started - ${this.currentSpeaker} speaking`);
    
    // Update state based on current speaker
    if (this.currentSpeaker === SpeakerRole.SOURCE) {
      this.updateConversationState(ConversationState.LISTENING_SOURCE);
    } else {
      this.updateConversationState(ConversationState.LISTENING_TARGET);
    }
  }

  /**
   * Handle speech chunk from voice activity service
   * Phase 2 - Process detected speech and manage state transitions
   * @param audioChunk Detected speech audio chunk
   */
  private async handleSpeechChunk(audioChunk: AudioChunk): Promise<void> {
    const speakerRole = this.currentSpeaker === SpeakerRole.SOURCE ? 'source' : 'target';
    console.log(`📦 AlwaysListeningService: Audio chunk received from ${speakerRole}`);
    console.log(`  Duration: ${audioChunk.duration}ms`);
    console.log(`  Timestamp: ${audioChunk.timestamp.toISOString()}`);
    
    // Update state to processing
    if (this.currentSpeaker === SpeakerRole.SOURCE) {
      this.updateConversationState(ConversationState.PROCESSING_SOURCE);
    } else {
      this.updateConversationState(ConversationState.PROCESSING_TARGET);
    }
    
    // Create conversation turn
    const turn: ConversationTurn = {
      id: `turn_${Date.now()}`,
      speaker: this.currentSpeaker,
      detectedLanguage: this.currentSpeaker === SpeakerRole.SOURCE ? this.sourceLanguage : this.targetLanguage,
      confidence: 0.95, // Dummy confidence for Phase 2
      audioChunk,
      timestamp: new Date()
    };
    
    // Add to conversation history
    this.conversationTurns.push(turn);
    
    // Update speaker info
    const speakerInfo = this.speakerInfo.get(this.currentSpeaker);
    if (speakerInfo) {
      speakerInfo.lastSpeechTime = new Date();
      speakerInfo.messageCount++;
      speakerInfo.totalSpeechTime += audioChunk.duration;
    }
    
    // Notify callbacks
    this.callbacks?.onConversationTurn(turn);
    
    // Simulate processing with delay
    console.log(`🧠 AlwaysListeningService: Processing ${speakerRole} speech...`);
    setTimeout(() => {
      this.simulateTranslationComplete();
    }, 500);
  }

  /**
   * Simulate translation completion
   * Phase 2 - Mock translation and prepare for speaker switch
   */
  private simulateTranslationComplete(): void {
    console.log(`✅ AlwaysListeningService: Translation complete for ${this.currentSpeaker}`);
    
    // Update state to speaking translation
    if (this.currentSpeaker === SpeakerRole.SOURCE) {
      this.updateConversationState(ConversationState.SPEAKING_TRANSLATION);
    } else {
      this.updateConversationState(ConversationState.SPEAKING_RESPONSE);
    }
    
    // Simulate speaking the translation
    setTimeout(() => {
      this.prepareSpeakerSwitch();
    }, 300);
  }

  /**
   * Prepare for speaker switch
   * Phase 2 - Set up for next speaker
   */
  private prepareSpeakerSwitch(): void {
    const previousSpeaker = this.currentSpeaker;
    console.log(`🔁 AlwaysListeningService: Preparing to switch from ${previousSpeaker}`);
    
    // Switch speaker
    this.switchSpeaker('auto');
  }

  /**
   * Handle silence detection for speaker switching
   * Phase 2 - Implement intelligent speaker switching
   * @param silenceDuration Duration of detected silence
   */
  private handleSilenceDetected(silenceDuration: number): void {
    console.log(`⏱️ AlwaysListeningService: Silence detected (${silenceDuration}ms) - Current speaker: ${this.currentSpeaker}`);
    
    // Check if we should switch speakers based on silence duration
    if (silenceDuration >= this.config.speakerSwitchTimeout) {
      console.log(`🔄 AlwaysListeningService: Silence threshold reached, considering speaker switch`);
      
      // Only switch if we're in a listening state
      if (this.currentState === ConversationState.LISTENING_SOURCE || 
          this.currentState === ConversationState.LISTENING_TARGET) {
        this.switchSpeaker('silence');
      }
    }
    
    // Notify callbacks if they exist
    if (this.callbacks?.onSilenceDetected) {
      this.callbacks.onSilenceDetected(silenceDuration);
    }
  }

  /**
   * Detect language from audio chunk
   * TODO: Phase 3 - Implement language detection logic
   * @param audioChunk Audio to analyze for language
   * @returns Promise resolving to detected language and confidence
   */
  private async detectLanguage(audioChunk: AudioChunk): Promise<{
    language: string;
    confidence: number;
  }> {
    // TODO: Use OpenAI Whisper for language detection
    // TODO: Apply confidence thresholds
    // TODO: Handle uncertain detections
    // TODO: Return language and confidence score
    return {
      language: this.currentSpeaker === SpeakerRole.SOURCE ? this.sourceLanguage : this.targetLanguage,
      confidence: 1.0
    };
  }

  /**
   * Determine speaker based on detected language and context
   * TODO: Phase 3 - Implement smart speaker detection
   * @param detectedLanguage Language detected in audio
   * @param confidence Detection confidence score
   * @returns Determined speaker role
   */
  private determineSpeaker(detectedLanguage: string, confidence: number): SpeakerRole {
    // TODO: Compare detected language with source/target languages
    // TODO: Consider conversation context and timing
    // TODO: Apply confidence thresholds
    // TODO: Handle ambiguous cases
    return this.currentSpeaker;
  }

  /**
   * Switch to the next speaker in conversation
   * Phase 2 - Manage speaker transitions
   * @param reason Reason for speaker switch (silence, manual, language, timeout, auto)
   */
  private switchSpeaker(reason: 'silence' | 'manual' | 'language' | 'timeout' | 'auto'): void {
    const previousSpeaker = this.currentSpeaker;
    const newSpeaker = this.toggleSpeaker(this.currentSpeaker);
    
    // Log the switch
    if (previousSpeaker === SpeakerRole.SOURCE) {
      console.log(`🎙️ AlwaysListeningService: Speech ended for source`);
      console.log(`🔁 AlwaysListeningService: Switching to target`);
    } else {
      console.log(`🎙️ AlwaysListeningService: Speech ended for target`);
      console.log(`🔁 AlwaysListeningService: Switching to source`);
    }
    
    // Update current speaker
    this.currentSpeaker = newSpeaker;
    
    // Clear any pending timers
    if (this.switchTimer) {
      clearTimeout(this.switchTimer);
      this.switchTimer = null;
    }
    
    // Update speaker statistics
    const speakerInfo = this.speakerInfo.get(newSpeaker);
    if (speakerInfo) {
      speakerInfo.lastSpeechTime = new Date();
    }
    
    // Notify callbacks of speaker change
    this.callbacks?.onSpeakerSwitch(previousSpeaker, newSpeaker);
    
    // Transition conversation state
    const newState = newSpeaker === SpeakerRole.SOURCE 
      ? ConversationState.LISTENING_SOURCE 
      : ConversationState.LISTENING_TARGET;
    this.updateConversationState(newState);
  }

  /**
   * Manually override speaker switching
   * TODO: Phase 3 - Allow manual control over speaker switching
   * @param targetSpeaker Speaker to switch to
   */
  public manualSpeakerSwitch(targetSpeaker: SpeakerRole): void {
    // TODO: Check if manual override is enabled
    // TODO: Validate speaker switch request
    // TODO: Force speaker switch regardless of audio state
    // TODO: Update conversation flow accordingly
  }

  /**
   * Helper function to toggle speaker
   * Phase 2 - Simple speaker switching logic
   */
  private toggleSpeaker(current: SpeakerRole): SpeakerRole {
    return current === SpeakerRole.SOURCE ? SpeakerRole.TARGET : SpeakerRole.SOURCE;
  }

  /**
   * Update conversation state and notify callbacks
   * Phase 2 - Centralized state management
   */
  private updateConversationState(newState: ConversationState): void {
    const previousState = this.currentState;
    this.currentState = newState;
    
    console.log(`🧠 AlwaysListeningService: Conversation state updated: ${previousState} → ${newState}`);
    
    // Notify callbacks
    this.callbacks?.onStateChange(newState, this.currentSpeaker);
  }

  /**
   * Handle errors from voice activity service
   * Phase 2 - Error handling
   */
  private handleError(error: Error): void {
    console.error('❌ AlwaysListeningService: Error detected:', error);
    
    // Update state to error
    this.updateConversationState(ConversationState.ERROR);
    
    // Notify callbacks
    this.callbacks?.onError(error, 'voice_activity_error');
  }

  /**
   * Pause always listening mode temporarily
   * Phase 2 - Implement conversation pause functionality
   */
  public pauseConversation(): void {
    console.log('⏸️ AlwaysListeningService: Pausing conversation');
    
    // Update state to paused
    const previousState = this.currentState;
    this.updateConversationState(ConversationState.PAUSED);
    
    // Stop voice activity detection
    this.voiceActivityService.stopListening().catch(error => {
      console.error('❌ AlwaysListeningService: Error stopping VAD during pause:', error);
    });
    
    // Clear all active timers
    if (this.switchTimer) {
      clearTimeout(this.switchTimer);
      this.switchTimer = null;
    }
    
    console.log(`⏸️ AlwaysListeningService: Paused from state ${previousState}`);
  }

  /**
   * Resume paused conversation
   * TODO: Phase 3 - Resume from paused state
   */
  public resumeConversation(): void {
    // TODO: Restore conversation state
    // TODO: Resume voice activity detection
    // TODO: Restart speaker detection
    // TODO: Transition back to listening state
  }

  /**
   * Update conversation flow configuration
   * TODO: Phase 3 - Allow runtime configuration updates
   * @param newConfig Partial configuration to update
   */
  public updateConfig(newConfig: Partial<ConversationFlowConfig>): void {
    // TODO: Validate new configuration
    // TODO: Apply changes without interrupting conversation
    // TODO: Update dependent services if needed
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current conversation status and statistics
   * TODO: Phase 3 - Provide detailed conversation state info
   */
  public getConversationStatus(): {
    state: ConversationState;
    currentSpeaker: SpeakerRole;
    speakerStats: Map<SpeakerRole, SpeakerInfo>;
    turnCount: number;
    totalDuration: number;
    config: ConversationFlowConfig;
  } {
    return {
      state: this.currentState,
      currentSpeaker: this.currentSpeaker,
      speakerStats: this.speakerInfo,
      turnCount: this.conversationTurns.length,
      totalDuration: this.calculateTotalDuration(),
      config: this.config
    };
  }

  /**
   * Initialize speaker information tracking
   * Phase 2 - Set up speaker statistics tracking
   */
  private initializeSpeakerInfo(): void {
    // Initialize source speaker info
    this.speakerInfo.set(SpeakerRole.SOURCE, {
      role: SpeakerRole.SOURCE,
      language: this.sourceLanguage,
      lastSpeechTime: null,
      totalSpeechTime: 0,
      messageCount: 0
    });
    
    // Initialize target speaker info
    this.speakerInfo.set(SpeakerRole.TARGET, {
      role: SpeakerRole.TARGET,
      language: this.targetLanguage,
      lastSpeechTime: null,
      totalSpeechTime: 0,
      messageCount: 0
    });
  }

  /**
   * Calculate total conversation duration
   * TODO: Phase 3 - Provide conversation timing metrics
   */
  private calculateTotalDuration(): number {
    // TODO: Calculate time from first to last turn
    // TODO: Consider pause times
    // TODO: Return duration in milliseconds
    return 0;
  }

  /**
   * Clean up resources when service is destroyed
   * TODO: Phase 2 - Ensure proper cleanup
   */
  public async dispose(): Promise<void> {
    // TODO: Stop always listening if active
    // TODO: Dispose voice activity service
    // TODO: Clear all timers and callbacks
    // TODO: Reset all internal state
  }
}

export default AlwaysListeningService;