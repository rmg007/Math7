import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigManager, KnowledgeConfig } from './config.js';

export class SupabaseManager {
  private static instance: SupabaseManager;
  private client: SupabaseClient;
  private config: KnowledgeConfig;

  private constructor() {
    this.config = ConfigManager.getInstance().getConfig();
    this.client = createClient(this.config.supabase.url, this.config.supabase.service_key);
  }

  static getInstance(): SupabaseManager {
    if (!SupabaseManager.instance) {
      SupabaseManager.instance = new SupabaseManager();
    }
    return SupabaseManager.instance;
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.client.from('knowledge_chunks').select('count').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  async searchKnowledge(queryEmbedding: number[], threshold = 0.5, count = 5): Promise<any[]> {
    try {
      const { data, error } = await this.client.rpc('match_knowledge_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: count,
      });

      if (error) {
        throw new Error(`Supabase search failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error searching knowledge:', error);
      throw error;
    }
  }

  async getKnowledgeStats(): Promise<{ total_chunks: number; indexed_files: number }> {
    try {
      const { data: chunks } = await this.client
        .from('knowledge_chunks')
        .select('id', { count: 'exact' });

      const { data: files } = await this.client
        .from('knowledge_chunks')
        .select('file_path')
        .then(({ data }) => {
          const uniqueFiles = new Set((data || []).map(chunk => chunk.file_path));
          return { data: Array.from(uniqueFiles) };
        });

      return {
        total_chunks: chunks?.length || 0,
        indexed_files: files?.data?.length || 0,
      };
    } catch (error) {
      console.error('Error getting knowledge stats:', error);
      return { total_chunks: 0, indexed_files: 0 };
    }
  }

  async getLastSyncTimestamp(): Promise<Date> {
    try {
      const { data } = await this.client
        .from('knowledge_chunks')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      return data?.updated_at ? new Date(data.updated_at) : new Date(0);
    } catch {
      return new Date(0);
    }
  }
}
