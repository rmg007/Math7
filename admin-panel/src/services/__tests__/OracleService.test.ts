import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OracleService } from '../OracleService';
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

  it('handles search queries', async () => {
    (supabase.functions.invoke as any).mockResolvedValue({
      data: { results: [{ id: '1', content: 'test', similarity: 0.9 }] },
      error: null,
    });

    const res = await OracleService.search('how to fix bug');
    expect(res).toHaveLength(1);
    expect(supabase.functions.invoke).toHaveBeenCalledWith('oracle-query', {
      body: { query: 'how to fix bug' },
    });
  });

  it('handles empty query', async () => {
    const res = await OracleService.search('  ');
    expect(res).toEqual([]);
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('findSolutionForError delegates to search', async () => {
    const searchSpy = vi.spyOn(OracleService, 'search').mockResolvedValue([]);
    await OracleService.findSolutionForError(new Error('test error'));
    expect(searchSpy).toHaveBeenCalledWith('Error: test error');
  });
});
