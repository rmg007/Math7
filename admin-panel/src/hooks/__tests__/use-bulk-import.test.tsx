/**
 * use-bulk-import.test.tsx
 *
 * Tests: CSV parsing, queue management, dry-run flag, progress tracking,
 *        and error paths for useBulkImport.
 *
 * Test IDs: AP-HOOK-020 .. AP-HOOK-031
 */
import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mock refs (must be declared before vi.mock factories execute) ──────
const mockToast = vi.hoisted(() => vi.fn());

// ── Module mocks ───────────────────────────────────────────────────────────────
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('papaparse', () => ({
  default: { parse: vi.fn() },
}));

vi.mock('@/services/CurriculumService', () => ({
  CurriculumService: {
    importQuestionsBulk: vi.fn(),
  },
}));

// ── Imports (after mocks are registered) ──────────────────────────────────────
import Papa from 'papaparse';
import { CurriculumService } from '@/services/CurriculumService';
import { useBulkImport } from '../use-bulk-import';

// ── Fixtures ───────────────────────────────────────────────────────────────────
const MOCK_QUESTION = {
  type: 'multiple_choice',
  content: 'What is 2+2?',
  points: 10,
  difficulty_level: 1,
  skill_id: 'skill-1',
  is_published: true,
  solution: '4',
  metadata: {},
  options: [
    { text: '4', is_correct: true },
    { text: '3', is_correct: false },
  ],
} as const;

/** Simulate a file-upload event with a given file object. */
function makeFileEvent(file: File) {
  return {
    target: { files: [file] },
  } as unknown as React.ChangeEvent<HTMLInputElement>;
}

/** Make Papa.parse invoke the `complete` callback with the given row data. */
function stubPapaSuccess(rows: Record<string, string>[]) {
  // Cast through `any` to bypass papaparse's stream-overload ambiguity
  (Papa.parse as any).mockImplementation((_file: unknown, options: any) => {
    options.complete({ data: rows });
  });
}

/** Make Papa.parse invoke the `error` callback with the given error. */
function stubPapaError(message: string) {
  (Papa.parse as any).mockImplementation((_file: unknown, options: any) => {
    options.error({ message });
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────────
describe('useBulkImport — initial state — AP-HOOK-020', () => {
  it('AP-HOOK-020: exposes expected initial state', () => {
    const { result } = renderHook(() => useBulkImport());
    expect(result.current.importQueue).toEqual([]);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.isDryRun).toBe(true);
    expect(result.current.progress).toBe(0);
  });
});

describe('useBulkImport — handleFileUpload — AP-HOOK-021', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AP-HOOK-021: does nothing when event has no file', () => {
    const { result } = renderHook(() => useBulkImport());
    const emptyEvent = {
      target: { files: null },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileUpload(emptyEvent);
    });

    expect(Papa.parse).not.toHaveBeenCalled();
    expect(result.current.importQueue).toHaveLength(0);
  });

  it('AP-HOOK-022: parses CSV and appends rows to the importQueue', () => {
    stubPapaSuccess([
      {
        type: 'multiple_choice',
        content: 'Q1',
        points: '10',
        difficulty_level: '1',
        skill_id: 'sk-1',
        solution: 'A',
        metadata: '{}',
        options: '[{"text":"A","is_correct":true}]',
      },
      {
        type: 'boolean',
        content: 'Q2',
        points: '5',
        difficulty_level: '2',
        skill_id: 'sk-2',
        solution: 'true',
      },
    ]);

    const { result } = renderHook(() => useBulkImport());
    const file = new File([''], 'questions.csv', { type: 'text/csv' });

    act(() => {
      result.current.handleFileUpload(makeFileEvent(file));
    });

    expect(result.current.importQueue).toHaveLength(2);
    expect(result.current.importQueue[0].content).toBe('Q1');
    expect(result.current.importQueue[1].content).toBe('Q2');
  });

  it('AP-HOOK-023: defaults question type to "multiple_choice" when type column is missing', () => {
    stubPapaSuccess([
      {
        content: 'No type field',
        points: '10',
        difficulty_level: '1',
        skill_id: 'sk-1',
        solution: 'ans',
      },
    ]);

    const { result } = renderHook(() => useBulkImport());
    const file = new File([''], 'test.csv', { type: 'text/csv' });

    act(() => {
      result.current.handleFileUpload(makeFileEvent(file));
    });

    expect(result.current.importQueue[0].type).toBe('multiple_choice');
  });

  it('AP-HOOK-024: sets options to null for boolean and text_input question types', () => {
    stubPapaSuccess([
      {
        type: 'boolean',
        content: 'True or false?',
        points: '5',
        difficulty_level: '1',
        skill_id: 'sk-1',
        solution: 'true',
        options: '[{"text":"yes","is_correct":true}]',
      },
      {
        type: 'text_input',
        content: 'Fill in the blank',
        points: '5',
        difficulty_level: '1',
        skill_id: 'sk-1',
        solution: 'answer',
      },
    ]);

    const { result } = renderHook(() => useBulkImport());

    act(() => {
      result.current.handleFileUpload(makeFileEvent(new File([''], 'test.csv')));
    });

    // boolean and text_input ignore the options column
    expect(result.current.importQueue[0].options).toBeNull();
    expect(result.current.importQueue[1].options).toBeNull();
  });

  it('AP-HOOK-025: falls back to empty object for invalid metadata JSON', () => {
    stubPapaSuccess([
      {
        type: 'multiple_choice',
        content: 'Q',
        points: '10',
        difficulty_level: '1',
        skill_id: 'sk-1',
        solution: 'a',
        metadata: '{INVALID}',
      },
    ]);

    const { result } = renderHook(() => useBulkImport());

    act(() => {
      result.current.handleFileUpload(makeFileEvent(new File([''], 'test.csv')));
    });

    // metadata exists at runtime (parsed from CSV) but is not in the QueuedQuestion Zod type
    expect((result.current.importQueue[0] as Record<string, unknown>).metadata).toEqual({});
  });

  it('AP-HOOK-026: appends to existing queue (does not replace)', () => {
    stubPapaSuccess([
      {
        type: 'multiple_choice',
        content: 'Second',
        points: '10',
        difficulty_level: '1',
        skill_id: 'sk-1',
        solution: 'b',
      },
    ]);

    const { result } = renderHook(() => useBulkImport());
    act(() => {
      result.current.setImportQueue([MOCK_QUESTION as any]);
    });

    act(() => {
      result.current.handleFileUpload(makeFileEvent(new File([''], 'test.csv')));
    });

    expect(result.current.importQueue).toHaveLength(2);
  });

  it('AP-HOOK-027: shows a destructive toast on CSV parse error', () => {
    stubPapaError('CSV syntax error');

    const { result } = renderHook(() => useBulkImport());

    act(() => {
      result.current.handleFileUpload(makeFileEvent(new File([''], 'bad.csv')));
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Parsing Error', variant: 'destructive' })
    );
  });
});

describe('useBulkImport — processImport — AP-HOOK-028', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('AP-HOOK-028: does nothing when the queue is empty', async () => {
    const { result } = renderHook(() => useBulkImport());

    await act(async () => {
      await result.current.processImport();
    });

    expect(CurriculumService.importQuestionsBulk).not.toHaveBeenCalled();
    expect(result.current.isProcessing).toBe(false);
  });

  it('AP-HOOK-029: calls service with dry-run flag by default and keeps queue intact', async () => {
    vi.mocked(CurriculumService.importQuestionsBulk).mockResolvedValue({
      success: true,
      count: 1,
    });

    const { result } = renderHook(() => useBulkImport());
    act(() => {
      result.current.setImportQueue([MOCK_QUESTION as any]);
    });

    await act(async () => {
      await result.current.processImport();
    });

    expect(CurriculumService.importQuestionsBulk).toHaveBeenCalledWith([MOCK_QUESTION], {
      dryRun: true,
      batchSize: 50,
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Dry Run Successful' })
    );
    // Queue not cleared on dry run
    expect(result.current.importQueue).toHaveLength(1);
    expect(result.current.isProcessing).toBe(false);
  });

  it('AP-HOOK-030: live import clears the queue after success', async () => {
    vi.mocked(CurriculumService.importQuestionsBulk).mockResolvedValue({
      success: true,
      count: 1,
    });

    const { result } = renderHook(() => useBulkImport());
    act(() => {
      result.current.setImportQueue([MOCK_QUESTION as any]);
      result.current.setIsDryRun(false); // switch to live mode
    });

    await act(async () => {
      await result.current.processImport();
    });

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Import Successful' }));
    expect(result.current.importQueue).toHaveLength(0);
  });

  it('AP-HOOK-031: shows error toast when service returns success:false', async () => {
    vi.mocked(CurriculumService.importQuestionsBulk).mockResolvedValue({
      success: false,
      count: 0,
      error: 'Validation failed on row 3',
    });

    const { result } = renderHook(() => useBulkImport());
    act(() => {
      result.current.setImportQueue([MOCK_QUESTION as any]);
    });

    await act(async () => {
      await result.current.processImport();
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Import Error', variant: 'destructive' })
    );
    expect(result.current.isProcessing).toBe(false);
  });

  it('AP-HOOK-032: shows unexpected-error toast when service throws', async () => {
    vi.mocked(CurriculumService.importQuestionsBulk).mockRejectedValue(
      new Error('Network timeout')
    );

    const { result } = renderHook(() => useBulkImport());
    act(() => {
      result.current.setImportQueue([MOCK_QUESTION as any]);
    });

    await act(async () => {
      await result.current.processImport();
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Unexpected Error', variant: 'destructive' })
    );
    expect(result.current.isProcessing).toBe(false);
  });

  it('AP-HOOK-033: resets progress to 0 after the 1-second cooldown timer fires', async () => {
    vi.mocked(CurriculumService.importQuestionsBulk).mockResolvedValue({
      success: true,
      count: 1,
    });

    const { result } = renderHook(() => useBulkImport());
    act(() => {
      result.current.setImportQueue([MOCK_QUESTION as any]);
    });

    await act(async () => {
      await result.current.processImport();
    });

    // Immediately after completion, progress is 100
    expect(result.current.progress).toBe(100);

    // Advance past the 1-second cooldown
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.progress).toBe(0);
  });
});
