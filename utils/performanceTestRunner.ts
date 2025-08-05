/**
 * Performance Test Runner
 * Comprehensive testing for translation performance across different conditions
 */

import { translateText } from '../api/languageService';
import { performanceMonitor } from './performanceMonitor';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TestResult {
  testId: string;
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  networkCondition: string;
  totalTime: number;
  apiTime?: number;
  cacheHit: boolean;
  success: boolean;
  error?: string;
  timestamp: Date;
}

interface TestReport {
  summary: {
    totalTests: number;
    successfulTests: number;
    averageTime: number;
    medianTime: number;
    minTime: number;
    maxTime: number;
    under1500ms: number;
    under1500msPercentage: number;
    cacheHitRate: number;
  };
  byNetworkCondition: Record<string, {
    tests: number;
    avgTime: number;
    successRate: number;
  }>;
  byLanguagePair: Record<string, {
    tests: number;
    avgTime: number;
  }>;
  coldVsWarm: {
    coldStart: number;
    warmStart: number;
    improvement: number;
  };
  bottlenecks: string[];
  results: TestResult[];
}

export class PerformanceTestRunner {
  private results: TestResult[] = [];
  private networkDelays = {
    'WiFi': 0,
    '4G': 50,
    '3G': 150,
    'Slow': 300
  };
  
  // Test cases covering different language types
  private testCases = [
    // Popular language pairs (speech-enabled)
    { text: 'Hello, how are you?', source: 'en', target: 'es', type: 'speech' },
    { text: 'Thank you very much', source: 'en', target: 'fr', type: 'speech' },
    { text: 'Good morning', source: 'en', target: 'de', type: 'speech' },
    
    // Text-only languages
    { text: 'Where is the hotel?', source: 'en', target: 'ne', type: 'text-only' }, // Nepali
    { text: 'I need help', source: 'en', target: 'am', type: 'text-only' }, // Amharic
    
    // Complex sentences
    { text: 'Could you please tell me where the nearest restaurant is?', source: 'en', target: 'ja', type: 'speech' },
    { text: 'I would like to order a coffee with milk', source: 'en', target: 'it', type: 'speech' },
    
    // Common phrases (should be cached)
    { text: 'Hello', source: 'en', target: 'es', type: 'cached' },
    { text: 'Thank you', source: 'en', target: 'fr', type: 'cached' },
    { text: 'Yes', source: 'en', target: 'de', type: 'cached' }
  ];
  
  async runComprehensiveTest(): Promise<TestReport> {
    console.log('🚀 Starting comprehensive performance tests...\n');
    this.results = [];
    
    // Clear performance monitor for fresh stats
    performanceMonitor.reset();
    
    // Test 1: Cold start test
    console.log('❄️ Testing cold start performance...');
    await this.clearCaches();
    const coldStartResult = await this.measureTranslation(
      this.testCases[0].text,
      this.testCases[0].source,
      this.testCases[0].target,
      'WiFi',
      'cold-start'
    );
    
    // Test 2: Network condition tests
    console.log('\n📡 Testing across network conditions...');
    for (const [network, delay] of Object.entries(this.networkDelays)) {
      console.log(`\nTesting ${network} (${delay}ms added latency):`);
      
      for (const testCase of this.testCases.slice(0, 5)) {
        await this.simulateNetworkDelay(delay);
        await this.measureTranslation(
          testCase.text,
          testCase.source,
          testCase.target,
          network,
          `${network}-${testCase.type}`
        );
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Test 3: Rapid succession test
    console.log('\n⚡ Testing rapid translations...');
    const rapidTests = [];
    for (let i = 0; i < 5; i++) {
      const testCase = this.testCases[i % this.testCases.length];
      rapidTests.push(
        this.measureTranslation(
          testCase.text,
          testCase.source,
          testCase.target,
          'WiFi',
          `rapid-${i}`
        )
      );
    }
    await Promise.all(rapidTests);
    
    // Test 4: Warm start test (same as cold start for comparison)
    console.log('\n🔥 Testing warm start performance...');
    const warmStartResult = await this.measureTranslation(
      this.testCases[0].text,
      this.testCases[0].source,
      this.testCases[0].target,
      'WiFi',
      'warm-start'
    );
    
    // Generate report
    return this.generateReport(coldStartResult, warmStartResult);
  }
  
  private async measureTranslation(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    networkCondition: string,
    testId: string
  ): Promise<TestResult> {
    const startTime = Date.now();
    let result: TestResult = {
      testId,
      text,
      sourceLanguage,
      targetLanguage,
      networkCondition,
      totalTime: 0,
      cacheHit: false,
      success: false,
      timestamp: new Date()
    };
    
    try {
      // Check if this might be a cache hit
      const cacheKey = `${sourceLanguage}:${targetLanguage}:${text.toLowerCase().trim()}`;
      const maybeCached = await AsyncStorage.getItem(`@translation_cache:${cacheKey}`);
      result.cacheHit = !!maybeCached;
      
      // Perform translation
      const translation = await translateText(text, sourceLanguage, targetLanguage);
      
      result.totalTime = Date.now() - startTime;
      result.success = true;
      
      // Log result
      const status = result.totalTime < 1500 ? '✅' : '⚠️';
      const cacheIndicator = result.cacheHit ? ' (cached)' : '';
      console.log(
        `${status} "${text.substring(0, 30)}..." (${sourceLanguage}→${targetLanguage}): ` +
        `${result.totalTime}ms${cacheIndicator}`
      );
      
    } catch (error) {
      result.totalTime = Date.now() - startTime;
      result.success = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ Translation failed: ${result.error}`);
    }
    
    this.results.push(result);
    return result;
  }
  
  private async simulateNetworkDelay(ms: number): Promise<void> {
    if (ms > 0) {
      await new Promise(resolve => setTimeout(resolve, ms));
    }
  }
  
  private async clearCaches(): Promise<void> {
    // Clear translation cache
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('@translation_cache:'));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
    console.log('🧹 Cleared translation caches');
  }
  
  private generateReport(coldStart: TestResult, warmStart: TestResult): TestReport {
    const successfulResults = this.results.filter(r => r.success);
    const times = successfulResults.map(r => r.totalTime).sort((a, b) => a - b);
    
    // Calculate summary statistics
    const summary = {
      totalTests: this.results.length,
      successfulTests: successfulResults.length,
      averageTime: times.length > 0 
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        : 0,
      medianTime: times.length > 0 
        ? times[Math.floor(times.length / 2)]
        : 0,
      minTime: times.length > 0 ? times[0] : 0,
      maxTime: times.length > 0 ? times[times.length - 1] : 0,
      under1500ms: times.filter(t => t < 1500).length,
      under1500msPercentage: times.length > 0
        ? Math.round((times.filter(t => t < 1500).length / times.length) * 100)
        : 0,
      cacheHitRate: successfulResults.length > 0
        ? Math.round((successfulResults.filter(r => r.cacheHit).length / successfulResults.length) * 100)
        : 0
    };
    
    // Group by network condition
    const byNetworkCondition: Record<string, any> = {};
    for (const condition of Object.keys(this.networkDelays)) {
      const conditionResults = successfulResults.filter(r => r.networkCondition === condition);
      if (conditionResults.length > 0) {
        const conditionTimes = conditionResults.map(r => r.totalTime);
        byNetworkCondition[condition] = {
          tests: conditionResults.length,
          avgTime: Math.round(conditionTimes.reduce((a, b) => a + b, 0) / conditionTimes.length),
          successRate: Math.round((conditionResults.length / 
            this.results.filter(r => r.networkCondition === condition).length) * 100)
        };
      }
    }
    
    // Group by language pair
    const byLanguagePair: Record<string, any> = {};
    successfulResults.forEach(result => {
      const pair = `${result.sourceLanguage}→${result.targetLanguage}`;
      if (!byLanguagePair[pair]) {
        byLanguagePair[pair] = { tests: 0, totalTime: 0 };
      }
      byLanguagePair[pair].tests++;
      byLanguagePair[pair].totalTime += result.totalTime;
    });
    
    // Calculate averages for language pairs
    Object.keys(byLanguagePair).forEach(pair => {
      byLanguagePair[pair].avgTime = Math.round(
        byLanguagePair[pair].totalTime / byLanguagePair[pair].tests
      );
      delete byLanguagePair[pair].totalTime;
    });
    
    // Cold vs warm start comparison
    const coldVsWarm = {
      coldStart: coldStart.totalTime,
      warmStart: warmStart.totalTime,
      improvement: Math.round(((coldStart.totalTime - warmStart.totalTime) / coldStart.totalTime) * 100)
    };
    
    // Identify bottlenecks
    const bottlenecks: string[] = [];
    if (summary.averageTime > 1500) {
      bottlenecks.push(`Average translation time (${summary.averageTime}ms) exceeds 1500ms target`);
    }
    if (summary.maxTime > 3000) {
      bottlenecks.push(`Worst-case time (${summary.maxTime}ms) is too high`);
    }
    if (summary.cacheHitRate < 20) {
      bottlenecks.push(`Low cache hit rate (${summary.cacheHitRate}%) - consider pre-warming cache`);
    }
    if (byNetworkCondition['Slow'] && byNetworkCondition['Slow'].avgTime > 2500) {
      bottlenecks.push('Performance degrades significantly on slow networks');
    }
    
    // Get performance monitor stats
    const perfStats = performanceMonitor.getStats();
    if (perfStats.avgTranscription > 800) {
      bottlenecks.push(`Transcription is slow (${perfStats.avgTranscription}ms avg)`);
    }
    if (perfStats.avgTranslation > 700) {
      bottlenecks.push(`Translation API is slow (${perfStats.avgTranslation}ms avg)`);
    }
    
    return {
      summary,
      byNetworkCondition,
      byLanguagePair,
      coldVsWarm,
      bottlenecks,
      results: this.results
    };
  }
  
  formatReport(report: TestReport): string {
    let output = '\n📊 PERFORMANCE TEST REPORT\n';
    output += '═'.repeat(50) + '\n\n';
    
    // Summary
    output += '📈 Summary Statistics:\n';
    output += `  • Total tests: ${report.summary.totalTests}\n`;
    output += `  • Successful: ${report.summary.successfulTests} (${Math.round(report.summary.successfulTests / report.summary.totalTests * 100)}%)\n`;
    output += `  • Average time: ${report.summary.averageTime}ms ${report.summary.averageTime < 1500 ? '✅' : '❌'}\n`;
    output += `  • Median time: ${report.summary.medianTime}ms\n`;
    output += `  • Min/Max: ${report.summary.minTime}ms / ${report.summary.maxTime}ms\n`;
    output += `  • Under 1500ms: ${report.summary.under1500ms} (${report.summary.under1500msPercentage}%) ${report.summary.under1500msPercentage >= 95 ? '✅' : '❌'}\n`;
    output += `  • Cache hit rate: ${report.summary.cacheHitRate}%\n\n`;
    
    // Network conditions
    output += '📡 By Network Condition:\n';
    Object.entries(report.byNetworkCondition).forEach(([condition, stats]) => {
      output += `  • ${condition}: ${stats.avgTime}ms avg, ${stats.successRate}% success\n`;
    });
    output += '\n';
    
    // Language pairs
    output += '🌍 By Language Pair:\n';
    Object.entries(report.byLanguagePair)
      .sort((a, b) => b[1].avgTime - a[1].avgTime)
      .slice(0, 5)
      .forEach(([pair, stats]) => {
        output += `  • ${pair}: ${stats.avgTime}ms avg (${stats.tests} tests)\n`;
      });
    output += '\n';
    
    // Cold vs warm
    output += '🔥 Cold vs Warm Start:\n';
    output += `  • Cold start: ${report.coldVsWarm.coldStart}ms\n`;
    output += `  • Warm start: ${report.coldVsWarm.warmStart}ms\n`;
    output += `  • Improvement: ${report.coldVsWarm.improvement}%\n\n`;
    
    // Pass/Fail criteria
    output += '✅ Pass Criteria:\n';
    output += `  ${report.summary.under1500msPercentage >= 95 ? '✅' : '❌'} 95%+ translations under 1500ms (actual: ${report.summary.under1500msPercentage}%)\n`;
    output += `  ${report.summary.successfulTests === report.summary.totalTests ? '✅' : '⚠️'} All translations successful\n`;
    output += `  ${report.bottlenecks.length === 0 ? '✅' : '⚠️'} No major bottlenecks identified\n\n`;
    
    // Bottlenecks
    if (report.bottlenecks.length > 0) {
      output += '⚠️ Bottlenecks & Recommendations:\n';
      report.bottlenecks.forEach(bottleneck => {
        output += `  • ${bottleneck}\n`;
      });
    } else {
      output += '🎉 Performance target achieved! No bottlenecks detected.\n';
    }
    
    return output;
  }
}

export const performanceTestRunner = new PerformanceTestRunner();