/**
 * Translation Cache System
 * Caches common translations to improve performance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry {
  translation: string;
  timestamp: number;
  hits: number;
}

interface CacheKey {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

class TranslationCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private readonly cachePrefix = '@translation_cache:';
  private readonly maxMemoryCacheSize = 500;
  private readonly cacheTTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  // Common phrases that should always be cached
  private readonly priorityPhrases = [
    'hello', 'hi', 'good morning', 'good afternoon', 'good evening',
    'thank you', 'thanks', 'please', 'sorry', 'excuse me',
    'yes', 'no', 'okay', 'maybe', 'i don\'t know',
    'how are you', 'i\'m fine', 'nice to meet you',
    'goodbye', 'bye', 'see you later', 'take care',
    'where is', 'how much', 'what time', 'help',
    'i need', 'i want', 'can you', 'do you have',
    'water', 'food', 'bathroom', 'hospital', 'police',
    'left', 'right', 'straight', 'stop', 'go',
    'one', 'two', 'three', 'four', 'five',
    'today', 'tomorrow', 'yesterday', 'now', 'later'
  ];
  
  constructor() {
    this.loadPersistentCache();
  }
  
  private getCacheKey(key: CacheKey): string {
    const normalizedText = key.text.toLowerCase().trim();
    return `${key.sourceLanguage}:${key.targetLanguage}:${normalizedText}`;
  }
  
  async get(key: CacheKey): Promise<string | null> {
    const cacheKey = this.getCacheKey(key);
    
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry) {
      // Check if not expired
      if (Date.now() - memoryEntry.timestamp < this.cacheTTL) {
        memoryEntry.hits++;
        console.log(`💾 Cache hit (memory): "${key.text}" - ${memoryEntry.hits} hits`);
        return memoryEntry.translation;
      } else {
        // Remove expired entry
        this.memoryCache.delete(cacheKey);
      }
    }
    
    // Check persistent cache
    try {
      const stored = await AsyncStorage.getItem(this.cachePrefix + cacheKey);
      if (stored) {
        const entry: CacheEntry = JSON.parse(stored);
        if (Date.now() - entry.timestamp < this.cacheTTL) {
          entry.hits++;
          // Promote to memory cache
          this.memoryCache.set(cacheKey, entry);
          this.enforceMemoryCacheLimit();
          console.log(`💾 Cache hit (persistent): "${key.text}" - ${entry.hits} hits`);
          return entry.translation;
        } else {
          // Remove expired entry
          await AsyncStorage.removeItem(this.cachePrefix + cacheKey);
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    
    return null;
  }
  
  async set(key: CacheKey, translation: string): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    const entry: CacheEntry = {
      translation,
      timestamp: Date.now(),
      hits: 0
    };
    
    // Add to memory cache
    this.memoryCache.set(cacheKey, entry);
    this.enforceMemoryCacheLimit();
    
    // Persist if it's a priority phrase or frequently used
    const isPriority = this.priorityPhrases.some(phrase => 
      key.text.toLowerCase().includes(phrase)
    );
    
    if (isPriority || entry.hits > 2) {
      try {
        await AsyncStorage.setItem(
          this.cachePrefix + cacheKey,
          JSON.stringify(entry)
        );
        console.log(`💾 Cached translation: "${key.text}" → "${translation}"`);
      } catch (error) {
        console.error('Cache write error:', error);
      }
    }
  }
  
  private enforceMemoryCacheLimit(): void {
    if (this.memoryCache.size > this.maxMemoryCacheSize) {
      // Remove least recently used entries
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, entries.length - this.maxMemoryCacheSize);
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
    }
  }
  
  private async loadPersistentCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      if (cacheKeys.length > 0) {
        const items = await AsyncStorage.multiGet(cacheKeys);
        let loadedCount = 0;
        
        for (const [key, value] of items) {
          if (value) {
            try {
              const entry: CacheEntry = JSON.parse(value);
              // Only load non-expired entries
              if (Date.now() - entry.timestamp < this.cacheTTL) {
                const cacheKey = key.replace(this.cachePrefix, '');
                this.memoryCache.set(cacheKey, entry);
                loadedCount++;
                
                // Stop if memory cache is getting full
                if (this.memoryCache.size >= this.maxMemoryCacheSize * 0.8) {
                  break;
                }
              }
            } catch (error) {
              console.error('Invalid cache entry:', error);
            }
          }
        }
        
        console.log(`💾 Loaded ${loadedCount} translations from cache`);
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
    }
  }
  
  async preloadCommonPhrases(languages: string[]): Promise<void> {
    console.log('📥 Preloading common phrases for languages:', languages);
    
    // This would typically fetch from a pre-translated database
    // For now, we'll just mark them for priority caching
    for (const phrase of this.priorityPhrases.slice(0, 10)) {
      for (const targetLang of languages) {
        if (targetLang !== 'en') {
          const key = { text: phrase, sourceLanguage: 'en', targetLanguage: targetLang };
          // Check if already cached
          const cached = await this.get(key);
          if (!cached) {
            // Mark for priority translation on first use
            console.log(`📌 Marked for priority: "${phrase}" → ${targetLang}`);
          }
        }
      }
    }
  }
  
  getStats(): {
    memoryCacheSize: number;
    totalHits: number;
    topPhrases: Array<{ phrase: string; hits: number }>;
  } {
    let totalHits = 0;
    const phraseHits: { [key: string]: number } = {};
    
    this.memoryCache.forEach((entry, key) => {
      totalHits += entry.hits;
      const parts = key.split(':');
      const phrase = parts[2] || key;
      phraseHits[phrase] = (phraseHits[phrase] || 0) + entry.hits;
    });
    
    const topPhrases = Object.entries(phraseHits)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([phrase, hits]) => ({ phrase, hits }));
    
    return {
      memoryCacheSize: this.memoryCache.size,
      totalHits,
      topPhrases
    };
  }
  
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
      console.log('💾 Translation cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}

// Singleton instance
export const translationCache = new TranslationCache();