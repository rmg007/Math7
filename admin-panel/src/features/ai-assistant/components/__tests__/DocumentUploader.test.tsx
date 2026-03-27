import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentUploader } from '../DocumentUploader';

// ─── Mocks ─────────────────────────────────────────────────────────────────

// vi.mock() is hoisted to the top of the file by Vitest. Any variables
// referenced inside mock factories MUST exist at hoist time — use vi.hoisted().
const { mockGetDocument, mockExtractRawText } = vi.hoisted(() => ({
  mockGetDocument: vi.fn(),
  mockExtractRawText: vi.fn(),
}));

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: mockGetDocument,
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: mockExtractRawText,
  },
}));

// Mock react-dropzone to give us fine-grained control
const mockGetRootProps = vi.fn(() => ({}));
const mockGetInputProps = vi.fn(() => ({}));
let dropCallback: ((files: File[]) => void) | null = null;

vi.mock('react-dropzone', () => ({
  useDropzone: ({
    onDrop,
  }: {
    onDrop: (files: File[]) => void;
    accept: Record<string, string[]>;
    maxFiles: number;
    multiple: boolean;
  }) => {
    dropCallback = onDrop;
    return {
      getRootProps: mockGetRootProps,
      getInputProps: mockGetInputProps,
      isDragActive: false,
    };
  },
}));

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Create a test File with an `arrayBuffer()` polyfill.
 * JSDOM does not implement `File.prototype.arrayBuffer`, but the DocumentUploader
 * component calls it for PDF/DOCX extraction. We patch each instance so the
 * mock chain succeeds without needing to change production code.
 */
function createFile(name: string, type: string, sizeBytes = 1024): File {
  const content = 'x'.repeat(sizeBytes);
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  // Polyfill arrayBuffer for JSDOM environments
  if (!file.arrayBuffer) {
    Object.defineProperty(file, 'arrayBuffer', {
      value: () => {
        const buf = new ArrayBuffer(sizeBytes);
        new Uint8Array(buf).fill(120); // ASCII 'x'
        return Promise.resolve(buf);
      },
    });
  }
  return file;
}

/**
 * Invoke the dropzone callback. Throws clearly if the mock wasn't wired up
 * properly so the failure is immediately obvious.
 */
function triggerDrop(files: File[]) {
  if (!dropCallback) throw new Error('dropCallback was not registered by the mock');
  dropCallback(files);
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('DocumentUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dropCallback = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders idle state with upload instruction', () => {
    render(<DocumentUploader onTextExtracted={vi.fn()} />);

    expect(screen.getByText('Upload Source Document')).toBeInTheDocument();
    expect(screen.getByText(/Drag & drop or click to select/)).toBeInTheDocument();
    expect(screen.getByText(/PDF, DOCX, PNG, JPG/)).toBeInTheDocument();
  });

  it('shows correct max file size in idle state', () => {
    render(<DocumentUploader onTextExtracted={vi.fn()} maxSizeMB={5} />);

    expect(screen.getByText(/max 5MB/)).toBeInTheDocument();
  });

  it('shows error state when file size exceeds limit', async () => {
    const onTextExtracted = vi.fn();
    render(<DocumentUploader onTextExtracted={onTextExtracted} maxSizeMB={1} />);

    // Create a 2MB file (exceeds 1MB limit)
    const largeFile = createFile('big.pdf', 'application/pdf', 2 * 1024 * 1024);

    act(() => {
      triggerDrop([largeFile]);
    });

    await waitFor(() => {
      expect(screen.getByText('Upload Failed')).toBeInTheDocument();
      expect(screen.getByText(/exceeds 1MB limit/)).toBeInTheDocument();
    });

    expect(onTextExtracted).not.toHaveBeenCalled();
  });

  it('extracts text from a PDF file and calls onTextExtracted', async () => {
    const onTextExtracted = vi.fn();

    // Mock pdfjs chain
    const mockPage = {
      getTextContent: vi.fn().mockResolvedValue({
        items: [{ str: 'Hello' }, { str: ' from PDF' }],
      }),
    };
    const mockPdf = {
      numPages: 1,
      getPage: vi.fn().mockResolvedValue(mockPage),
    };
    mockGetDocument.mockReturnValue({ promise: Promise.resolve(mockPdf) });

    render(<DocumentUploader onTextExtracted={onTextExtracted} />);

    const pdfFile = createFile('test.pdf', 'application/pdf');
    act(() => {
      triggerDrop([pdfFile]);
    });

    await waitFor(() => {
      expect(screen.getByText(/Successfully extracted/)).toBeInTheDocument();
    });

    expect(onTextExtracted).toHaveBeenCalledWith(expect.stringContaining('Hello'), 'test.pdf');
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    // Text preview should be shown
    expect(screen.getByText('Extracted Text Preview')).toBeInTheDocument();
  });

  it('extracts text from a DOCX file and calls onTextExtracted', async () => {
    const onTextExtracted = vi.fn();
    mockExtractRawText.mockResolvedValue({ value: 'Hello from DOCX' });

    render(<DocumentUploader onTextExtracted={onTextExtracted} />);

    const docxFile = createFile(
      'test.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    act(() => {
      triggerDrop([docxFile]);
    });

    await waitFor(() => {
      expect(screen.getByText(/Successfully extracted/)).toBeInTheDocument();
    });

    expect(onTextExtracted).toHaveBeenCalledWith('Hello from DOCX', 'test.docx');
  });

  it('handles image files by returning a placeholder string', async () => {
    const onTextExtracted = vi.fn();

    render(<DocumentUploader onTextExtracted={onTextExtracted} />);

    const imageFile = createFile('photo.png', 'image/png');
    act(() => {
      triggerDrop([imageFile]);
    });

    await waitFor(() => {
      expect(screen.getByText(/Successfully extracted/)).toBeInTheDocument();
    });

    expect(onTextExtracted).toHaveBeenCalledWith(
      expect.stringContaining('[IMAGE: photo.png'),
      'photo.png'
    );
  });

  it('shows error state when PDF extraction fails', async () => {
    const onTextExtracted = vi.fn();
    const pdfParseError = Promise.reject(new Error('PDF parse error'));
    pdfParseError.catch(() => {}); // suppress unhandledRejection; component handles it
    mockGetDocument.mockReturnValue({ promise: pdfParseError });

    render(<DocumentUploader onTextExtracted={onTextExtracted} />);

    const pdfFile = createFile('broken.pdf', 'application/pdf');
    act(() => {
      triggerDrop([pdfFile]);
    });

    await waitFor(() => {
      expect(screen.getByText('Upload Failed')).toBeInTheDocument();
      expect(screen.getByText('PDF parse error')).toBeInTheDocument();
    });

    expect(onTextExtracted).not.toHaveBeenCalled();
  });

  it('shows error for unsupported file type', async () => {
    const onTextExtracted = vi.fn();

    render(<DocumentUploader onTextExtracted={onTextExtracted} />);

    const unsupportedFile = createFile('data.csv', 'text/csv');
    act(() => {
      triggerDrop([unsupportedFile]);
    });

    await waitFor(() => {
      expect(screen.getByText('Upload Failed')).toBeInTheDocument();
      expect(screen.getByText('Unsupported file type')).toBeInTheDocument();
    });

    expect(onTextExtracted).not.toHaveBeenCalled();
  });

  it('resets to idle state when "Try again" is clicked after an error', async () => {
    const onTextExtracted = vi.fn();
    const failureError = Promise.reject(new Error('Failure'));
    failureError.catch(() => {}); // suppress unhandledRejection; component handles it
    mockGetDocument.mockReturnValue({ promise: failureError });

    render(<DocumentUploader onTextExtracted={onTextExtracted} />);

    const pdfFile = createFile('fail.pdf', 'application/pdf');
    act(() => {
      triggerDrop([pdfFile]);
    });

    await waitFor(() => {
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(screen.getByText('Try again'));
    });

    expect(screen.getByText('Upload Source Document')).toBeInTheDocument();
  });

  it('resets to idle state when "Upload another document" is clicked after success', async () => {
    const onTextExtracted = vi.fn();
    mockExtractRawText.mockResolvedValue({ value: 'Some content' });

    render(<DocumentUploader onTextExtracted={onTextExtracted} />);

    const docxFile = createFile(
      'document.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    act(() => {
      triggerDrop([docxFile]);
    });

    await waitFor(() => {
      expect(screen.getByText('Upload another document')).toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(screen.getByText('Upload another document'));
    });

    expect(screen.getByText('Upload Source Document')).toBeInTheDocument();
  });

  it('does nothing when dropped files list is empty', async () => {
    const onTextExtracted = vi.fn();

    render(<DocumentUploader onTextExtracted={onTextExtracted} />);

    triggerDrop([]);

    // Should remain in idle state
    expect(screen.getByText('Upload Source Document')).toBeInTheDocument();
    expect(onTextExtracted).not.toHaveBeenCalled();
  });

  it('shows extracting state while processing', async () => {
    const onTextExtracted = vi.fn();

    // Never resolves — simulates slow extraction
    mockExtractRawText.mockReturnValue(new Promise(() => {}));

    render(<DocumentUploader onTextExtracted={onTextExtracted} />);

    const docxFile = createFile(
      'slow.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    act(() => {
      triggerDrop([docxFile]);
    });

    await waitFor(() => {
      expect(screen.getByText(/Processing slow.docx/)).toBeInTheDocument();
      expect(screen.getByText('Extracting text from document...')).toBeInTheDocument();
    });
  });

  it('truncates long extracted text previews to 500 characters', async () => {
    const onTextExtracted = vi.fn();
    const longText = 'A'.repeat(600);
    mockExtractRawText.mockResolvedValue({ value: longText });

    render(<DocumentUploader onTextExtracted={onTextExtracted} />);

    const docxFile = createFile(
      'long.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    act(() => {
      triggerDrop([docxFile]);
    });

    await waitFor(() => {
      expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
    });

    // Full text still passed to callback
    expect(onTextExtracted).toHaveBeenCalledWith(longText, 'long.docx');
  });
});
