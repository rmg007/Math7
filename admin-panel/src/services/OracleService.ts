import { supabase } from '@/lib/supabase';

export interface OracleResult {
  id: string;
  content: string;
  file_path: string;
  breadcrumb: string;
  similarity: number;
}

export class OracleService {
  /**
   * Queries the Project Oracle semantic knowledge base via the oracle-query Edge Function.
   * This is used for "Self-Healing" features where errors are matched against known patterns.
   */
  static async search(query: string): Promise<OracleResult[]> {
    if (!query || query.trim().length < 3) return [];

    try {
      const { data, error } = await supabase.functions.invoke('oracle-query', {
        body: { query }
      });

      if (error) {
        console.warn('Oracle Service Warning:', error);
        return [];
      }

      return data.results || [];
    } catch (err) {
      console.error('Oracle search failed:', err);
      return [];
    }
  }

  /**
   * Specifically handles error analysis by formatting the error into a query.
   */
  static async findSolutionForError(error: Error | string): Promise<OracleResult[]> {
    const message = typeof error === 'string' ? error : error.message;
    // We clean the error message a bit (e.g. removing UUIDs or specific IDs) to improve matching
    const cleanQuery = `Error: ${message}`.slice(0, 500);
    return this.search(cleanQuery);
  }
}
