import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OracleService } from '@/services/OracleService';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('OracleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search', () => {
    it('should return empty array for empty query', async () => {
      const result = await OracleService.search('');
      await OracleService.search('   ');
      
      expect(result).toEqual([]);
      expect(supabase.functions.invoke).not.toHaveBeenCalled();
    });

    it('should return empty array for short query', async () => {
      const result = await OracleService.search('ab');
      expect(result).toEqual([]);
      expect(supabase.functions.invoke).not.toHaveBeenCalled();
    });

    it('should call oracle-query Edge Function with correct parameters', async () => {
      const mockResults = [
        { 
          id: '1', 
          content: 'test content', 
          file_path: 'docs/test.md',
          breadcrumb: 'Docs > Test',
          similarity: 0.9 
        },
      ];

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { results: mockResults },
        error: null,
      } as any);

      const result = await OracleService.search('test query');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('oracle-query', {
        body: { query: 'test query' }
      });
      expect(result).toEqual(mockResults);
    });

    it('should handle invoke errors', async () => {
      const mockError = { message: 'Function failed' };
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: mockError as any,
      } as any);

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await OracleService.search('error query');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Oracle Service Warning:', mockError);
    });

    it('should handle unexpected errors', async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await OracleService.search('network error query');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Oracle search failed:', expect.any(Error));
    });
  });

  describe('findSolutionForError', () => {
    it('should format error message into a query', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { results: [] },
        error: null,
      } as any);

      await OracleService.findSolutionForError('Simple error');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('oracle-query', {
        body: { query: 'Error: Simple error' }
      });
    });

    it('should handle Error objects', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { results: [] },
        error: null,
      } as any);

      const error = new Error('Object error');
      await OracleService.findSolutionForError(error);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('oracle-query', {
        body: { query: 'Error: Object error' }
      });
    });

    it('should truncate long error messages', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { results: [] },
        error: null,
      } as any);

      const longMessage = 'A'.repeat(600);
      await OracleService.findSolutionForError(longMessage);

      const callArgs = vi.mocked(supabase.functions.invoke).mock.calls[0][1] as any;
      expect(callArgs.body.query.length).toBeLessThan(510);
      expect(callArgs.body.query).toMatch(/^Error: A+/);
    });
  });
});
