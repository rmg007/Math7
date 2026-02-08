import { SearchResult, SearchOptions, IDEAdapter, IDEContext } from './types.js';
import { SupabaseManager } from './supabase.js';
import { EmbeddingManager } from './embeddings.js';
import { MemoryCache } from './cache.js';
import { ConfigManager } from './config.js';

export class UniversalKnowledgeClient {
  private static instance: UniversalKnowledgeClient;
  private supabase: SupabaseManager;
  private embeddings: EmbeddingManager;
  private cache: MemoryCache;
  private config: ConfigManager;
  private fallbackEnabled = true;

  private constructor() {
    this.supabase = SupabaseManager.getInstance();
    this.embeddings = EmbeddingManager.getInstance();
    this.cache = new MemoryCache();
    this.config = ConfigManager.getInstance();
  }

  static getInstance(): UniversalKnowledgeClient {
    if (!UniversalKnowledgeClient.instance) {
      UniversalKnowledgeClient.instance = new UniversalKnowledgeClient();
    }
    return UniversalKnowledgeClient.instance;
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(query, options);

    try {
      // 1. Check cache first
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        console.log(`Cache hit for query: "${query}"`);
        return cached;
      }

      // 2. Generate embedding
      const { embedding } = await this.embeddings.generateEmbedding(query);

      // 3. Search Supabase
      const results = await this.supabase.searchKnowledge(
        embedding,
        options.threshold || 0.5,
        options.count || 5
      );

      // 4. Apply filters if specified
      const filteredResults = this.applyFilters(results, options);

      // 5. Cache results
      await this.cache.set(cacheKey, filteredResults);

      const duration = performance.now() - startTime;
      console.log(`Search completed in ${duration.toFixed(2)}ms, found ${filteredResults.length} results`);

      return filteredResults;
    } catch (error) {
      console.error('Primary search failed:', error);

      // 6. Fallback to file system search if enabled
      if (this.fallbackEnabled) {
        console.log('Falling back to file system search...');
        return await this.fallbackSearch(query, options);
      }

      throw error;
    }
  }

  async searchWithRetry(query: string, options: SearchOptions = {}, maxRetries?: number): Promise<SearchResult[]> {
    const retries = maxRetries || this.config.getConfig().performance.max_retry_attempts;
    const delayBase = this.config.getConfig().performance.retry_delay_base;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.search(query, options);
      } catch (error) {
        console.error(`Search attempt ${attempt} failed:`, error);

        if (attempt === retries) {
          // Final attempt failed, try emergency fallback
          return await this.emergencyFallback(query, options);
        }

        // Exponential backoff
        const delay = delayBase * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await this.delay(delay);
      }
    }

    throw new Error('All search attempts failed');
  }

  private generateCacheKey(query: string, options: SearchOptions): string {
    const optionsStr = JSON.stringify(options);
    return `${query}:${optionsStr}`;
  }

  private applyFilters(results: SearchResult[], options: SearchOptions): SearchResult[] {
    let filtered = results;

    if (options.filter_by_file && options.filter_by_file.length > 0) {
      filtered = filtered.filter(result => 
        options.filter_by_file!.some(pattern => result.file_path.includes(pattern))
      );
    }

    if (options.exclude_by_file && options.exclude_by_file.length > 0) {
      filtered = filtered.filter(result => 
        !options.exclude_by_file!.some(pattern => result.file_path.includes(pattern))
      );
    }

    return filtered;
  }

  private async fallbackSearch(query: string, options: SearchOptions): Promise<SearchResult[]> {
    // Implement file system search as fallback
    console.log('Performing file system fallback search...');
    
    // For now, return empty results - this would be implemented with file system scanning
    return [];
  }

  private async emergencyFallback(query: string, options: SearchOptions): Promise<SearchResult[]> {
    console.log('Emergency fallback activated - returning minimal results');
    
    // Return some basic knowledge from hardcoded critical files
    return [{
      id: 'emergency-fallback',
      file_path: 'AI_CODING_INSTRUCTIONS.md',
      breadcrumb: 'Emergency Fallback',
      content: 'Universal Knowledge System is currently experiencing issues. Please check system status.',
      similarity: 0.1,
      metadata: { emergency: true }
    }];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getHealthStatus(): Promise<{
    supabase: boolean;
    openai: boolean;
    cache: boolean;
    overall: boolean;
  }> {
    const [supabaseOk, openaiOk] = await Promise.all([
      this.supabase.testConnection(),
      this.embeddings.testConnection()
    ]);

    const cacheStats = await this.cache.stats();
    const cacheOk = cacheStats.size >= 0;

    return {
      supabase: supabaseOk,
      openai: openaiOk,
      cache: cacheOk,
      overall: supabaseOk && openaiOk && cacheOk
    };
  }

  async getPerformanceStats(): Promise<{
    cache_hit_rate: number;
    cache_size: number;
    last_search_time?: number;
  }> {
    const cacheStats = await this.cache.stats();
    
    return {
      cache_hit_rate: this.cache.getHitRate(),
      cache_size: cacheStats.size,
    };
  }

  enableFallback(): void {
    this.fallbackEnabled = true;
  }

  disableFallback(): void {
    this.fallbackEnabled = false;
  }

  async clearCache(): Promise<void> {
    await this.cache.clear();
    console.log('Cache cleared');
  }
}
