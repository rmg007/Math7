import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OracleService, OracleResult } from '@/services/OracleService';
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
      expect(result).toEqual([]);
    });

    it('should return empty array for query with only whitespace', async () => {
      const result = await OracleService.search('   ');
      expect(result).toEqual([]);
    });

    it('should return empty array for query shorter than 3 characters', async () => {
      const result = await OracleService.search('ab');
      expect(result).toEqual([]);
    });

    it('should return empty array for null/undefined query', async () => {
      const result1 = await OracleService.search(null as any);
      const result2 = await OracleService.search(undefined as any);
      
      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
    });

    it('should call oracle-query function with valid query', async () => {
      const mockResults: OracleResult[] = [
        {
          id: '1',
          content: 'Solution content',
          file_path: '/path/to/file.ts',
          breadcrumb: 'Component > Function',
          similarity: 0.95,
        },
      ];

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { results: mockResults },
        error: null,
      });

      const result = await OracleService.search('test query');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('oracle-query', {
        body: { query: 'test query' },
      });
      expect(result).toEqual(mockResults);
    });

    it('should handle function errors gracefully', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'Function timeout' },
      });

      const result = await OracleService.search('test query');

      expect(result).toEqual([]);
    });

    it('should handle network errors gracefully', async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValue(
        new Error('Network error')
      );

      const result = await OracleService.search('test query');

      expect(result).toEqual([]);
    });

    it('should handle missing results in response', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await OracleService.search('test query');

      expect(result).toEqual([]);
    });

    it('should handle empty results array', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { results: [] },
        error: null,
      });

      const result = await OracleService.search('test query');

      expect(result).toEqual([]);
    });
  });

  describe('findSolutionForError', () => {
    it('should format error message into query', async () => {
      const mockResults: OracleResult[] = [
        {
          id: '1',
          content: 'Error solution',
          file_path: '/path/to/solution.ts',
          breadcrumb: 'Error Handling',
          similarity: 0.88,
        },
      ];

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { results: mockResults },
        error: null,
      });

      const error = new Error('Database connection failed');
      const result = await OracleService.findSolutionForError(error);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('oracle-query', {
        body: { query: 'Error: Database connection failed' },
      });
      expect(result).toEqual(mockResults);
    });

    it('should handle string error input', async () => {
      const mockResults: OracleResult[] = [
        {
          id: '1',
          content: 'String error solution',
          file_path: '/path/to/string-solution.ts',
          breadcrumb: 'String Error',
          similarity: 0.92,
        },
      ];

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { results: mockResults },
        error: null,
      });

      const result = await OracleService.findSolutionForError('String error message');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('oracle-query', {
        body: { query: 'Error: String error message' },
      });
      expect(result).toEqual(mockResults);
    });

    it('should truncate long error messages to 500 characters', async () => {
      const longErrorMessage = 'A'.repeat(600);
      const expectedQuery = `Error: ${'A'.repeat(492)}`; // "Error: " (7 chars) + 492 = 499

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { results: [] },
        error: null,
      });

      await OracleService.findSolutionForError(longErrorMessage);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('oracle-query', {
        body: { query: expectedQuery },
      });
    });

    it('should handle errors in findSolutionForError gracefully', async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValue(
        new Error('Oracle service down')
      );

      const error = new Error('Test error');
      const result = await OracleService.findSolutionForError(error);

      expect(result).toEqual([]);
    });

    it('should handle empty error message', async () => {
      const error = new Error('');
      const result = await OracleService.findSolutionForError(error);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('oracle-query', {
        body: { query: 'Error: ' },
      });
      expect(result).toEqual([]);
    });

    it('should handle error with special characters', async () => {
      const error = new Error('Error with special chars: !@#$%^&*()');
      
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { results: [] },
        error: null,
      });

      await OracleService.findSolutionForError(error);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('oracle-query', {
        body: { query: 'Error: Error with special chars: !@#$%^&*()' },
      });
    });
  });
});
