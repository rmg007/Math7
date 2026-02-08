import { LRUCache } from 'lru-cache';
import { CacheInterface, SearchResult } from './types.js';
import { ConfigManager } from './config.js';

export class MemoryCache implements CacheInterface {
  private cache: LRUCache<string, SearchResult[]>;
  private hits = 0;
  private misses = 0;

  constructor() {
    const config = ConfigManager.getInstance().getConfig();
    this.cache = new LRUCache<string, SearchResult[]>({
      max: config.cache.max_size,
      ttl: config.cache.ttl,
      allowStale: false,
    });
  }

  async get(key: string): Promise<SearchResult[] | null> {
    const result = this.cache.get(key);
    if (result) {
      this.hits++;
      return result;
    } else {
      this.misses++;
      return null;
    }
  }

  async set(key: string, value: SearchResult[], ttl?: number): Promise<void> {
    this.cache.set(key, value, { ttl });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  async stats(): Promise<{ hits: number; misses: number; size: number }> {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
    };
  }

  getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }
}
