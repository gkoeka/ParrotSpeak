/**
 * Performance Monitoring System
 * Tracks and optimizes translation performance across the app
 */

interface PerformanceMetrics {
  transcriptionTime: number;
  translationTime: number;
  totalTime: number;
  audioSize: number;
  textLength: number;
  timestamp: Date;
  sourceLanguage: string;
  targetLanguage: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 100; // Keep last 100 measurements
  
  addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    
    // Log if performance is degrading
    const avgTotal = this.getAverageTime('total');
    if (avgTotal > 1500) {
      console.warn(`⚠️ Performance degradation detected: ${avgTotal}ms average (target: 1500ms)`);
    }
  }
  
  getAverageTime(type: 'transcription' | 'translation' | 'total'): number {
    if (this.metrics.length === 0) return 0;
    
    const sum = this.metrics.reduce((acc, metric) => {
      switch (type) {
        case 'transcription':
          return acc + metric.transcriptionTime;
        case 'translation':
          return acc + metric.translationTime;
        case 'total':
          return acc + metric.totalTime;
      }
    }, 0);
    
    return Math.round(sum / this.metrics.length);
  }
  
  getPercentileTime(percentile: number, type: 'total' = 'total'): number {
    if (this.metrics.length === 0) return 0;
    
    const times = this.metrics.map(m => {
      switch (type) {
        case 'transcription':
          return m.transcriptionTime;
        case 'translation':
          return m.translationTime;
        default:
          return m.totalTime;
      }
    }).sort((a, b) => a - b);
    
    const index = Math.ceil((percentile / 100) * times.length) - 1;
    return times[index];
  }
  
  getStats(): {
    avgTranscription: number;
    avgTranslation: number;
    avgTotal: number;
    p95Total: number;
    p99Total: number;
    successRate: number;
    metricsCount: number;
  } {
    const totalRequests = this.metrics.length;
    const successfulRequests = this.metrics.filter(m => m.totalTime < 5000).length;
    
    return {
      avgTranscription: this.getAverageTime('transcription'),
      avgTranslation: this.getAverageTime('translation'),
      avgTotal: this.getAverageTime('total'),
      p95Total: this.getPercentileTime(95),
      p99Total: this.getPercentileTime(99),
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100,
      metricsCount: totalRequests
    };
  }
  
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const stats = this.getStats();
    
    if (stats.avgTranscription > 800) {
      suggestions.push('Consider reducing audio quality/duration to speed up transcription');
    }
    
    if (stats.avgTranslation > 700) {
      suggestions.push('Translation is slow - check API latency or enable more aggressive caching');
    }
    
    if (stats.p95Total > 2000) {
      suggestions.push('95th percentile exceeds 2s - investigate network conditions');
    }
    
    // Analyze by language pair
    const languagePairStats = this.getLanguagePairStats();
    for (const [pair, avgTime] of Object.entries(languagePairStats)) {
      if (avgTime > 1800) {
        suggestions.push(`${pair} translations are slow (${avgTime}ms avg) - consider caching common phrases`);
      }
    }
    
    return suggestions;
  }
  
  private getLanguagePairStats(): Record<string, number> {
    const pairTimes: Record<string, number[]> = {};
    
    this.metrics.forEach(metric => {
      const pair = `${metric.sourceLanguage}->${metric.targetLanguage}`;
      if (!pairTimes[pair]) {
        pairTimes[pair] = [];
      }
      pairTimes[pair].push(metric.totalTime);
    });
    
    const pairAverages: Record<string, number> = {};
    for (const [pair, times] of Object.entries(pairTimes)) {
      pairAverages[pair] = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    }
    
    return pairAverages;
  }
  
  reset(): void {
    this.metrics = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper to measure async operations
export async function measurePerformance<T>(
  operation: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    console.log(`⏱️ ${label}: ${duration}ms`);
    return { result, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ ${label} failed after ${duration}ms:`, error);
    throw error;
  }
}