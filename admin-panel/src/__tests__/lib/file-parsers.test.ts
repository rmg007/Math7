import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseFile } from '@/lib/file-parsers';
// @ts-expect-error - No types available for pdfjs-dist build
import * as pdfjs from 'pdfjs-dist/build/pdf';
import * as mammoth from 'mammoth';

// Mock PDF.js
vi.mock('pdfjs-dist/build/pdf', () => ({
  default: {
    getDocument: vi.fn(),
    GlobalWorkerOptions: {
      workerSrc: '',
    },
  },
}));

// Mock mammoth
vi.mock('mammoth', () => ({
  extractRawText: vi.fn(),
}));

// Mock console.error
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('file-parsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleError.mockClear();
  });

  describe('parseFile', () => {
    const mockPdfJs = pdfjs;
    const mockMammoth = mammoth;

    it('should parse PDF files', async () => {
      const mockPdf = {
        promise: Promise.resolve({
          numPages: 2,
          getPage: vi.fn().mockResolvedValue({
            getTextContent: vi.fn().mockResolvedValue({
              items: [
                { str: 'Page 1 content' },
                { str: 'with multiple' },
                { str: 'text items' },
              ],
            }),
          }),
        }),
      };

      vi.mocked(mockPdfJs.default.getDocument).mockReturnValue(mockPdf as any);

      const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
      const result = await parseFile(file);

      expect(result).toEqual({
        name: 'test.pdf',
        content: expect.stringContaining('Page 1 content with multiple text items'),
        type: 'pdf',
      });
      expect(mockPdfJs.default.getDocument).toHaveBeenCalledWith({
        data: expect.any(ArrayBuffer),
      });
    });

    it('should parse DOCX files', async () => {
      vi.mocked(mockMammoth.extractRawText).mockResolvedValue({
        value: 'Document content from DOCX',
        messages: [],
      });

      const file = new File(['docx content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const result = await parseFile(file);

      expect(result).toEqual({
        name: 'test.docx',
        content: 'Document content from DOCX',
        type: 'docx',
      });
      expect(mockMammoth.extractRawText).toHaveBeenCalledWith({
        arrayBuffer: expect.any(ArrayBuffer),
      });
    });

    it('should parse TXT files', async () => {
      const file = new File(['plain text content'], 'test.txt', { type: 'text/plain' });
      const result = await parseFile(file);

      expect(result).toEqual({
        name: 'test.txt',
        content: 'plain text content',
        type: 'txt',
      });
    });

    it('should handle multiple pages in PDF', async () => {
      const mockPdf = {
        promise: Promise.resolve({
          numPages: 3,
          getPage: vi.fn()
            .mockResolvedValueOnce({
              getTextContent: vi.fn().mockResolvedValue({
                items: [{ str: 'Page 1' }],
              }),
            })
            .mockResolvedValueOnce({
              getTextContent: vi.fn().mockResolvedValue({
                items: [{ str: 'Page 2' }],
              }),
            })
            .mockResolvedValueOnce({
              getTextContent: vi.fn().mockResolvedValue({
                items: [{ str: 'Page 3' }],
              }),
            }),
        }),
      };

      vi.mocked(mockPdfJs.default.getDocument).mockReturnValue(mockPdf as any);

      const file = new File(['pdf content'], 'multipage.pdf', { type: 'application/pdf' });
      const result = await parseFile(file);

      expect(result.content).toContain('--- Page 1 ---');
      expect(result.content).toContain('--- Page 2 ---');
      expect(result.content).toContain('--- Page 3 ---');
      expect(result.content).toContain('Page 1');
      expect(result.content).toContain('Page 2');
      expect(result.content).toContain('Page 3');
    });

    it('should handle empty PDF pages', async () => {
      const mockPdf = {
        promise: Promise.resolve({
          numPages: 2,
          getPage: vi.fn().mockResolvedValue({
            getTextContent: vi.fn().mockResolvedValue({
              items: [],
            }),
          }),
        }),
      };

      vi.mocked(mockPdfJs.default.getDocument).mockReturnValue(mockPdf as any);

      const file = new File(['pdf content'], 'empty.pdf', { type: 'application/pdf' });
      const result = await parseFile(file);

      expect(result.content).toContain('--- Page 1 ---');
      expect(result.content).toContain('--- Page 2 ---');
    });

    it('should throw error for unsupported file types', async () => {
      const file = new File(['content'], 'test.xyz', { type: 'application/xyz' });

      await expect(parseFile(file)).rejects.toThrow('Unsupported file type: xyz');
    });

    it('should handle PDF parsing errors', async () => {
      const mockPdf = {
        promise: Promise.reject(new Error('PDF parsing failed')),
      };

      vi.mocked(mockPdfJs.default.getDocument).mockReturnValue(mockPdf as any);

      const file = new File(['pdf content'], 'broken.pdf', { type: 'application/pdf' });

      await expect(parseFile(file)).rejects.toThrow('Failed to parse broken.pdf: PDF parsing failed');
      expect(mockConsoleError).toHaveBeenCalledWith('Error parsing file:', expect.any(Error));
    });

    it('should handle DOCX parsing errors', async () => {
      vi.mocked(mockMammoth.extractRawText).mockRejectedValue(new Error('DOCX parsing failed'));

      const file = new File(['docx content'], 'broken.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      await expect(parseFile(file)).rejects.toThrow('Failed to parse broken.docx: DOCX parsing failed');
      expect(mockConsoleError).toHaveBeenCalledWith('Error parsing file:', expect.any(Error));
    });

    it('should handle file reading errors for TXT files', async () => {
      // Mock FileReader to simulate error
      const mockFileReader = {
        readAsText: vi.fn().mockImplementation(() => {
          throw new Error('File reading failed');
        }),
      };

      global.FileReader = vi.fn().mockImplementation(() => mockFileReader) as any;

      const file = new File(['content'], 'broken.txt', { type: 'text/plain' });

      await expect(parseFile(file)).rejects.toThrow('Failed to parse broken.txt: File reading failed');
      expect(mockConsoleError).toHaveBeenCalledWith('Error parsing file:', expect.any(Error));
    });

    it('should handle mammoth warnings', async () => {
      vi.mocked(mockMammoth.extractRawText).mockResolvedValue({
        value: 'Content with warnings',
        messages: [{ type: 'warning', message: 'Some warning' }],
      } as any);

      const file = new File(['content'], 'warnings.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const result = await parseFile(file);

      expect(result.content).toBe('Content with warnings');
    });
  });
});
