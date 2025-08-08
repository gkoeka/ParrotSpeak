/**
 * AlwaysListeningService.ts
 * 
 * Purpose: Controls speaker switching logic, turn-taking coordination, and manages
 * the conversation state machine for always listening mode. This service orchestrates
 * the high-level conversation flow, language detection, and speaker transitions.
 */

// Temporarily commented out - migrated to SimplifiedVADService
// import VoiceActivityService, { AudioChunk } from './VoiceActivityService';
import { speechService } from './speechService';
import * as Speech from 'expo-speech';

// Temporary AudioChunk type definition (was from VoiceActivityService)
export interface AudioChunk {
  uri: string;
  duration: number;
  timestamp: Date;
}

// Re-export AudioChunk for other modules
// export { AudioChunk } from './VoiceActivityService';

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
  transcription?: string;
  translation?: string;
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
  onTranscriptionStart?: () => void;
  onTranscriptionComplete?: (transcription: { text: string; language: string; confidence: number; timestamp: Date }) => void;
  onTranslationComplete?: (translation: { text: string; fromLanguage: string; toLanguage: string; timestamp: Date }) => void;
}

export class AlwaysListeningService {
  // private voiceActivityService: VoiceActivityService; // Temporarily disabled - using SimplifiedVADService
  private voiceActivityService: any; // Placeholder type
  private currentState: ConversationState = ConversationState.IDLE;
  private currentSpeaker: SpeakerRole = SpeakerRole.SOURCE;
  private config: ConversationFlowConfig;
  private callbacks: AlwaysListeningCallbacks | null = null;
  private sourceLanguage: string = 'en';
  private targetLanguage: string = 'es';
  private speakerInfo: Map<SpeakerRole, SpeakerInfo> = new Map();
  private conversationTurns: ConversationTurn[] = [];
  private switchTimer: NodeJS.Timeout | null = null;
  private processingQueue: Set<string> = new Set(); // Track chunks being processed
  private maxQueueSize: number = 10; // Maximum chunks to keep in memory

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
    // this.voiceActivityService = new VoiceActivityService(); // Temporarily disabled
    this.voiceActivityService = null; // Will be replaced with SimplifiedVADService integration
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
   * Phase 3 - Process detected speech through AI pipeline
   * @param audioChunk Detected speech audio chunk
   */
  private async handleSpeechChunk(audioChunk: AudioChunk): Promise<void> {
    const speakerRole = this.currentSpeaker === SpeakerRole.SOURCE ? 'source' : 'target';
    console.log(`📦 AlwaysListeningService: Audio chunk received from ${speakerRole}`);
    console.log(`  Duration: ${audioChunk.duration}ms`);
    console.log(`  Timestamp: ${audioChunk.timestamp.toISOString()}`);
    console.log(`  URI: ${audioChunk.uri}`);
    
    // Check if chunk is already being processed
    const chunkId = `${audioChunk.timestamp.getTime()}-${audioChunk.uri}`;
    if (this.processingQueue.has(chunkId)) {
      console.warn('⚠️ AlwaysListeningService: Chunk already being processed, skipping duplicate');
      return;
    }
    
    // Add to processing queue
    this.processingQueue.add(chunkId);
    
    // Check queue size and remove oldest if exceeded
    if (this.processingQueue.size > this.maxQueueSize) {
      console.warn(`⚠️ AlwaysListeningService: Queue size exceeded (${this.processingQueue.size}), removing oldest`);
      const oldest = Array.from(this.processingQueue)[0];
      this.processingQueue.delete(oldest);
    }
    
    console.log(`📊 AlwaysListeningService: Processing queue size: ${this.processingQueue.size}`);
    
    // Update state to processing
    if (this.currentSpeaker === SpeakerRole.SOURCE) {
      this.updateConversationState(ConversationState.PROCESSING_SOURCE);
    } else {
      this.updateConversationState(ConversationState.PROCESSING_TARGET);
    }
    
    try {
      // Check if speech service is ready
      if (!speechService.isReady()) {
        console.log('🔑 AlwaysListeningService: Initializing speech service...');
        // Notify about transcription start
        if (this.callbacks?.onTranscriptionStart) {
          this.callbacks.onTranscriptionStart();
        }
        await speechService.initialize();
      } else {
        // Notify about transcription start
        if (this.callbacks?.onTranscriptionStart) {
          this.callbacks.onTranscriptionStart();
        }
      }
      
      // Phase 3: Process audio through AI pipeline
      console.log('🧠 AlwaysListeningService: Sending to Whisper...');
      
      const sourceLanguage = this.currentSpeaker === SpeakerRole.SOURCE ? this.sourceLanguage : this.targetLanguage;
      const targetLanguage = this.currentSpeaker === SpeakerRole.SOURCE ? this.targetLanguage : this.sourceLanguage;
      
      const { transcription, translation, totalDuration } = await speechService.processAudioChunk(
        audioChunk.uri,
        sourceLanguage,
        targetLanguage
      );
      
      console.log(`📝 AlwaysListeningService: Transcription: "${transcription.text}"`);
      console.log(`🌍 AlwaysListeningService: Translation: "${translation.text}"`);
      console.log(`⏱️ AlwaysListeningService: Total processing time: ${totalDuration}ms`);
      
      // Check for empty transcription
      if (!transcription.text || transcription.text.trim().length === 0) {
        console.log('⚠️ AlwaysListeningService: Empty transcription, skipping turn');
        // Switch back to listening state
        if (this.currentSpeaker === SpeakerRole.SOURCE) {
          this.updateConversationState(ConversationState.LISTENING_SOURCE);
        } else {
          this.updateConversationState(ConversationState.LISTENING_TARGET);
        }
        return;
      }
      
      // Check language detection confidence
      if (transcription.confidence < 0.5) {
        console.warn(`⚠️ AlwaysListeningService: Low language confidence: ${transcription.confidence}`);
      }
      
      // Update detected language if confidence is high
      if (transcription.confidence > this.config.languageConfidenceThreshold) {
        this.callbacks?.onLanguageDetected(transcription.language, transcription.confidence);
      }
      
      // Create conversation turn with real transcription/translation
      const turn: ConversationTurn = {
        id: `turn_${Date.now()}`,
        speaker: this.currentSpeaker,
        detectedLanguage: transcription.language,
        confidence: transcription.confidence,
        audioChunk,
        timestamp: new Date(),
        transcription: transcription.text,
        translation: translation.text
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
      
      // Notify UI of transcription and translation completion
      if (this.callbacks?.onTranscriptionComplete) {
        this.callbacks.onTranscriptionComplete({
          text: transcription.text,
          language: transcription.language,
          confidence: transcription.confidence,
          timestamp: new Date()
        });
      }
      
      if (this.callbacks?.onTranslationComplete) {
        this.callbacks.onTranslationComplete({
          text: translation.text,
          fromLanguage: translation.fromLanguage,
          toLanguage: translation.toLanguage,
          timestamp: new Date()
        });
      }
      
      // Speak the translation
      if (translation.text && translation.text.trim().length > 0) {
        await this.speakTranslation(translation.text, targetLanguage);
      } else {
        console.log('⚠️ AlwaysListeningService: Empty translation, switching speakers');
        this.switchSpeaker('auto');
      }
      
    } catch (error) {
      console.error('❌ AlwaysListeningService: Error processing audio chunk:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('OpenAI API key')) {
          console.error('🔑 AlwaysListeningService: OpenAI API key not configured');
          this.callbacks?.onError(new Error('OpenAI API key required for transcription'), 'api_key_missing');
        } else if (error.message.includes('Whisper API error')) {
          console.error('🌐 AlwaysListeningService: Whisper API error');
          this.callbacks?.onError(error, 'whisper_api_error');
        } else if (error.message.includes('Audio file not found')) {
          console.error('📁 AlwaysListeningService: Audio file not found');
          this.callbacks?.onError(error, 'audio_file_error');
        } else {
          this.callbacks?.onError(error, 'processAudioChunk');
        }
      }
      
      // Update state to error
      this.updateConversationState(ConversationState.ERROR);
      
      // Try to recover by switching speakers after a delay
      setTimeout(() => {
        this.switchSpeaker('error_recovery');
      }, 2000);
    } finally {
      // Remove from processing queue when done
      this.processingQueue.delete(chunkId);
      console.log(`✅ AlwaysListeningService: Chunk processed, queue size: ${this.processingQueue.size}`);
    }
  }
  
  /**
   * Speak translation using expo-speech
   * Phase 3 - Synthesize and play translated text
   */
  private async speakTranslation(text: string, language: string): Promise<void> {
    console.log(`🔈 AlwaysListeningService: Speaking: "${text.substring(0, 50)}..." in ${language}`);
    
    try {
      // Cancel any pending speech before playing new
      await Speech.stop();
      console.log('🔇 AlwaysListeningService: Cancelled pending speech');
    } catch (error) {
      console.warn('⚠️ AlwaysListeningService: Failed to cancel pending speech:', error);
    }
    
    // Update state to speaking
    if (this.currentSpeaker === SpeakerRole.SOURCE) {
      this.updateConversationState(ConversationState.SPEAKING_TRANSLATION);
    } else {
      this.updateConversationState(ConversationState.SPEAKING_RESPONSE);
    }
    
    return new Promise((resolve) => {
      Speech.speak(text, {
        language: language,
        pitch: 1.0,
        rate: 1.0,
        onDone: () => {
          console.log('✅ AlwaysListeningService: Speech synthesis completed successfully');
          // Switch speakers after speaking
          this.switchSpeaker('auto');
          resolve();
        },
        onError: (error) => {
          console.error('❌ AlwaysListeningService: Speech synthesis error:', error);
          console.error('❌ AlwaysListeningService: Language not supported on device:', language);
          // Switch speakers even on error to continue conversation
          this.switchSpeaker('error_recovery');
          resolve();
        }
      });
    });
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
   * @param reason Reason for speaker switch (silence, manual, language, timeout, auto, error_recovery)
   */
  private switchSpeaker(reason: 'silence' | 'manual' | 'language' | 'timeout' | 'auto' | 'error_recovery'): void {
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