import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBulkImport } from '@/hooks/use-bulk-import';
import { CurriculumService } from '@/services/CurriculumService';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
vi.mock('@/services/CurriculumService');
vi.mock('@/hooks/use-toast');
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
  },
}));

// Mock File and FileReader
global.File = class File {
  constructor(public chunks: any[], public name: string, public options?: any) {}
} as any;

describe('useBulkImport', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast } as any);
    vi.mocked(CurriculumService.importQuestionsBulk).mockResolvedValue({
      success: true,
      count: 5,
    });
  });

  describe('initial state', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useBulkImport());

      expect(result.current.importQueue).toEqual([]);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.isDryRun).toBe(true);
      expect(result.current.progress).toBe(0);
      expect(typeof result.current.handleFileUpload).toBe('function');
      expect(typeof result.current.processImport).toBe('function');
      expect(typeof result.current.setImportQueue).toBe('function');
      expect(typeof result.current.setIsDryRun).toBe('function');
    });
  });

  describe('handleFileUpload', () => {
    it('should handle file upload and parse CSV successfully', async () => {
      const Papa = await import('papaparse');
      const mockFile = new File([''], 'test.csv');
      const mockData = [
        { content: 'Question 1', points: '10', skill_id: 'skill-1' },
        { content: 'Question 2', points: '15', skill_id: 'skill-2' },
      ];

      vi.mocked(Papa.default.parse).mockImplementation((file, options) => {
        options?.complete?.(mockData as any);
        options?.error?.(new Error('Test error'));
      });

      const { result } = renderHook(() => useBulkImport());

      const mockEvent = {
        target: { files: [mockFile] },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleFileUpload(mockEvent);
      });

      expect(result.current.progress).toBe(0);
      expect(result.current.importQueue).toHaveLength(2);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'File Loaded',
        description: 'Queued 2 questions from test.csv',
      });
    });

    it('should handle parsing errors', async () => {
      const Papa = await import('papaparse');
      const mockFile = new File([''], 'test.csv');
      const parseError = new Error('Invalid CSV format');

      vi.mocked(Papa.default.parse).mockImplementation((file, options) => {
        options?.error?.(parseError);
      });

      const { result } = renderHook(() => useBulkImport());

      const mockEvent = {
        target: { files: [mockFile] },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleFileUpload(mockEvent);
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Parsing Error',
        description: 'Invalid CSV format',
        variant: 'destructive',
      });
    });

    it('should return early if no file is selected', () => {
      const { result } = renderHook(() => useBulkImport());

      const mockEvent = {
        target: { files: null },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleFileUpload(mockEvent);
      });

      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should parse CSV rows with correct defaults', async () => {
      const Papa = await import('papaparse');
      const mockFile = new File([''], 'test.csv');
      const mockData = [
        { content: 'Question 1' }, // Minimal data
        { 
          content: 'Question 2',
          type: 'boolean',
          points: '20',
          difficulty_level: '3',
          skill_id: 'skill-2',
          solution: 'Answer 2',
          metadata: '{"category": "math"}',
          options: '[{"text": "True", "is_correct": true}]',
        },
      ];

      vi.mocked(Papa.default.parse).mockImplementation((file, options) => {
        options?.complete?.(mockData as any);
      });

      const { result } = renderHook(() => useBulkImport());

      const mockEvent = {
        target: { files: [mockFile] },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleFileUpload(mockEvent);
      });

      const queue = result.current.importQueue;
      expect(queue).toHaveLength(2);
      
      // First row with defaults
      expect(queue[0]).toMatchObject({
        type: 'multiple_choice',
        content: 'Question 1',
        points: 10,
        difficulty_level: 1,
        is_published: true,
        solution: '',
        metadata: {},
        options: [],
      });

      // Second row with explicit values
      expect(queue[1]).toMatchObject({
        type: 'boolean',
        content: 'Question 2',
        points: 20,
        difficulty_level: 3,
        skill_id: 'skill-2',
        solution: 'Answer 2',
        metadata: { category: 'math' },
        options: [{ text: 'True', is_correct: true }],
      });
    });
  });

  describe('processImport', () => {
    it('should process import successfully in dry run mode', async () => {
      vi.mocked(CurriculumService.importQuestionsBulk).mockResolvedValue({
        success: true,
        count: 5,
        isDryRun: true,
      });

      const { result } = renderHook(() => useBulkImport());

      // Set up some questions in queue
      act(() => {
        result.current.setImportQueue([
          { type: 'multiple_choice', content: 'Test', points: 10 } as any,
        ]);
      });

      await act(async () => {
        await result.current.processImport();
      });

      expect(CurriculumService.importQuestionsBulk).toHaveBeenCalledWith(
        expect.any(Array),
        { dryRun: true, batchSize: 50 }
      );

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Dry Run Successful',
        description: 'All 5 questions passed validation.',
        className: 'bg-amber-600 text-white',
      });

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.progress).toBe(0); // Should reset after delay
    });

    it('should process import successfully in production mode', async () => {
      vi.mocked(CurriculumService.importQuestionsBulk).mockResolvedValue({
        success: true,
        count: 3,
      });

      const { result } = renderHook(() => useBulkImport());

      // Switch to production mode
      act(() => {
        result.current.setIsDryRun(false);
        result.current.setImportQueue([
          { type: 'multiple_choice', content: 'Test' } as any,
        ]);
      });

      await act(async () => {
        await result.current.processImport();
      });

      expect(CurriculumService.importQuestionsBulk).toHaveBeenCalledWith(
        expect.any(Array),
        { dryRun: false, batchSize: 50 }
      );

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Import Successful',
        description: 'Successfully imported 3 questions.',
        className: 'bg-emerald-600 text-white',
      });

      expect(result.current.importQueue).toEqual([]); // Should clear queue
    });

    it('should handle import errors', async () => {
      vi.mocked(CurriculumService.importQuestionsBulk).mockResolvedValue({
        success: false,
        count: 0,
        error: 'Validation failed',
      });

      const { result } = renderHook(() => useBulkImport());

      act(() => {
        result.current.setImportQueue([{ type: 'multiple_choice', content: 'Test' } as any]);
      });

      await act(async () => {
        await result.current.processImport();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Import Error',
        description: 'Validation failed',
        variant: 'destructive',
      });

      expect(result.current.isProcessing).toBe(false);
    });

    it('should handle unexpected errors', async () => {
      vi.mocked(CurriculumService.importQuestionsBulk).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useBulkImport());

      act(() => {
        result.current.setImportQueue([{ type: 'multiple_choice', content: 'Test' } as any]);
      });

      await act(async () => {
        await result.current.processImport();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Unexpected Error',
        description: 'Network error',
        variant: 'destructive',
      });

      expect(result.current.isProcessing).toBe(false);
    });

    it('should return early if queue is empty', async () => {
      const { result } = renderHook(() => useBulkImport());

      await act(async () => {
        await result.current.processImport();
      });

      expect(CurriculumService.importQuestionsBulk).not.toHaveBeenCalled();
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should update progress during processing', async () => {
      vi.mocked(CurriculumService.importQuestionsBulk).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, count: 1 }), 100))
      );

      const { result } = renderHook(() => useBulkImport());

      act(() => {
        result.current.setImportQueue([{ type: 'multiple_choice', content: 'Test' } as any]);
      });

      act(() => {
        result.current.processImport();
      });

      expect(result.current.progress).toBe(10);
      expect(result.current.isProcessing).toBe(true);

      await waitFor(() => {
        expect(result.current.progress).toBe(100);
      });

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false);
      }, { timeout: 200 });
    });
  });

  describe('setImportQueue', () => {
    it('should update import queue', () => {
      const { result } = renderHook(() => useBulkImport());

      act(() => {
        result.current.setImportQueue([{ type: 'multiple_choice', content: 'Test' } as any]);
      });

      expect(result.current.importQueue).toHaveLength(1);
    });
  });

  describe('setIsDryRun', () => {
    it('should update dry run mode', () => {
      const { result } = renderHook(() => useBulkImport());

      act(() => {
        result.current.setIsDryRun(false);
      });

      expect(result.current.isDryRun).toBe(false);
    });
  });
});
