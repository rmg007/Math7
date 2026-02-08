export interface SearchResult {
  id: string;
  file_path: string;
  breadcrumb: string;
  content: string;
  similarity: number;
  metadata?: Record<string, any>;
}

export interface SearchOptions {
  threshold?: number;
  count?: number;
  include_metadata?: boolean;
  filter_by_file?: string[];
  exclude_by_file?: string[];
}

export interface IDEContext {
  name: string;
  version?: string;
  platform: string;
  workspace_path: string;
  config_files: string[];
  capabilities: string[];
}

export interface KnowledgeChunk {
  id: string;
  file_path: string;
  breadcrumb: string;
  content: string;
  content_hash: string;
  embedding: number[];
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface SyncStatus {
  last_sync: Date;
  total_chunks: number;
  indexed_files: number;
  failed_files: string[];
  sync_in_progress: boolean;
}

export interface HealthStatus {
  healthy: boolean;
  checks: {
    supabase: boolean;
    openai: boolean;
    cache: boolean;
    sync: boolean;
  };
  errors: string[];
  warnings: string[];
}

export interface PerformanceMetrics {
  search_latency: number;
  cache_hit_rate: number;
  sync_success_rate: number;
  error_rate: number;
  uptime: number;
}

export interface IDEAdapter {
  name: string;
  detect(): boolean;
  initialize(): Promise<void>;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  getContext(): Promise<IDEContext>;
  cleanup(): Promise<void>;
}

export interface CacheInterface {
  get(key: string): Promise<SearchResult[] | null>;
  set(key: string, value: SearchResult[], ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  stats(): Promise<{ hits: number; misses: number; size: number }>;
}
