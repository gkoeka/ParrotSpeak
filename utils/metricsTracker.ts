/**
 * Lightweight metrics tracking for per-turn performance analysis
 */

export interface TurnMetrics {
  timestamp: number;
  recordMs: number;
  fileBytes?: number;
  whisperMs?: number;
  translateMs?: number;
  ttsMs?: number;
  detectedLang?: string;
  targetLang?: string;
  voiceUsed?: string;
  turnNumber?: number;
}

class MetricsTracker {
  private metrics: TurnMetrics[] = [];
  private readonly maxMetrics = 10; // Keep last 10 turns
  private turnCounter = 0;

  /**
   * Start a new turn and return a metrics collector
   */
  startTurn(): TurnMetricsCollector {
    this.turnCounter++;
    return new TurnMetricsCollector(this.turnCounter, (metrics) => {
      this.addMetrics(metrics);
    });
  }

  /**
   * Add completed metrics for a turn
   */
  private addMetrics(metrics: TurnMetrics) {
    this.metrics.push(metrics);
    
    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log the latest metrics in dev mode
    this.dumpLatestMetrics();
  }

  /**
   * Dump the latest metrics to console (dev-only)
   */
  private dumpLatestMetrics() {
    const latest = this.metrics[this.metrics.length - 1];
    if (!latest) return;

    const metricsStr = [
      `turn=${latest.turnNumber || 0}`,
      `recordMs=${latest.recordMs}`,
      latest.fileBytes ? `fileBytes=${latest.fileBytes}` : null,
      latest.whisperMs ? `whisperMs=${latest.whisperMs}` : null,
      latest.translateMs ? `translateMs=${latest.translateMs}` : null,
      latest.ttsMs ? `ttsMs=${latest.ttsMs}` : null,
      latest.detectedLang ? `detectedLang=${latest.detectedLang}` : null,
      latest.targetLang ? `targetLang=${latest.targetLang}` : null,
      latest.voiceUsed ? `voiceUsed=${latest.voiceUsed}` : null,
    ].filter(Boolean).join(', ');

    console.log(`📊 [Metrics] lastTurn={${metricsStr}}`);
  }

  /**
   * Get all stored metrics
   */
  getMetrics(): TurnMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get the latest metrics
   */
  getLatestMetrics(): TurnMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = [];
    this.turnCounter = 0;
  }
}

/**
 * Collector for a single turn's metrics
 */
export class TurnMetricsCollector {
  private metrics: TurnMetrics;
  private startTimes: Map<string, number> = new Map();
  private onComplete: (metrics: TurnMetrics) => void;

  constructor(turnNumber: number, onComplete: (metrics: TurnMetrics) => void) {
    this.metrics = {
      timestamp: Date.now(),
      recordMs: 0,
      turnNumber
    };
    this.onComplete = onComplete;
  }

  /**
   * Set recording duration
   */
  setRecordingDuration(ms: number) {
    this.metrics.recordMs = ms;
  }

  /**
   * Set file size in bytes
   */
  setFileSize(bytes: number) {
    this.metrics.fileBytes = bytes;
  }

  /**
   * Start timing an operation
   */
  startTimer(operation: 'whisper' | 'translate' | 'tts') {
    this.startTimes.set(operation, Date.now());
  }

  /**
   * End timing an operation
   */
  endTimer(operation: 'whisper' | 'translate' | 'tts') {
    const startTime = this.startTimes.get(operation);
    if (!startTime) return;

    const duration = Date.now() - startTime;
    if (operation === 'whisper') {
      this.metrics.whisperMs = duration;
    } else if (operation === 'translate') {
      this.metrics.translateMs = duration;
    } else if (operation === 'tts') {
      this.metrics.ttsMs = duration;
    }
    
    this.startTimes.delete(operation);
  }

  /**
   * Set detected language
   */
  setDetectedLanguage(lang: string) {
    this.metrics.detectedLang = lang;
  }

  /**
   * Set target language
   */
  setTargetLanguage(lang: string) {
    this.metrics.targetLang = lang;
  }

  /**
   * Set voice used for TTS
   */
  setVoiceUsed(voice: string) {
    this.metrics.voiceUsed = voice;
  }

  /**
   * Complete the metrics collection
   */
  complete() {
    this.onComplete(this.metrics);
  }
}

// Singleton instance
export const metricsTracker = new MetricsTracker();