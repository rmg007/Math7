import {
  downloadFile,
  downloadTemplate,
  exportToCSV,
  exportToJSON,
  parseCSV,
  parseJSON,
  readFileAsText,
  type DataColumn,
} from '@/lib/data-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock DOM APIs
const mockCreateElement = vi.fn();
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClick = vi.fn();

Object.defineProperty(global, 'Blob', {
  value: class Blob {
    constructor(
      public content: string[],
      public options: { type: string }
    ) {}
  },
});

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
});

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
});

// Mock alert
const mockAlert = vi.fn();
Object.defineProperty(global, 'alert', { value: mockAlert });

describe('data-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateElement.mockReturnValue({
      href: '',
      download: '',
      click: mockClick,
    });
    mockCreateObjectURL.mockReturnValue('blob-url');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportToCSV', () => {
    const testData = [
      { id: 1, name: 'John', age: 30 },
      { id: 2, name: 'Jane', age: 25 },
    ];

    const columns: DataColumn[] = [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'age', header: 'Age' },
    ];

    it('should export data to CSV format', () => {
      exportToCSV(testData, columns, 'test');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
    });

    it('should handle empty data array', () => {
      exportToCSV([], columns, 'test');

      expect(mockAlert).toHaveBeenCalledWith('No data to export');
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });

    it('should apply transform function when provided', () => {
      const columnsWithTransform: DataColumn[] = [
        { key: 'name', header: 'Name', transform: (value) => `Mr. ${value}` },
      ];

      exportToCSV(testData, columnsWithTransform, 'test');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });

    it('should handle null/undefined values', () => {
      const dataWithNulls = [
        { id: 1, name: null, age: undefined },
        { id: 2, name: 'Jane', age: 25 },
      ];

      exportToCSV(dataWithNulls, columns, 'test');

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('should escape CSV values with commas', () => {
      const dataWithCommas = [{ id: 1, name: 'Doe, John', age: 30 }];

      exportToCSV(dataWithCommas, columns, 'test');

      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg.content[0]).toContain('"Doe, John"');
    });

    it('should escape CSV values with quotes', () => {
      const dataWithQuotes = [{ id: 1, name: 'John "The Man" Doe', age: 30 }];

      exportToCSV(dataWithQuotes, columns, 'test');

      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg.content[0]).toContain('"John ""The Man"" Doe"');
    });

    it('should escape CSV values with newlines', () => {
      const dataWithNewlines = [{ id: 1, name: 'John\nDoe', age: 30 }];

      exportToCSV(dataWithNewlines, columns, 'test');

      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg.content[0]).toContain('"John\nDoe"');
    });
  });

  describe('exportToJSON', () => {
    const testData = [{ id: 1, name: 'John' }];

    it('should export data to JSON format', () => {
      exportToJSON(testData, 'test');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg.content[0]).toContain('"id": 1');
      expect(blobArg.content[0]).toContain('"name": "John"');
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
    });

    it('should handle empty data array', () => {
      exportToJSON([], 'test');

      expect(mockAlert).toHaveBeenCalledWith('No data to export');
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('downloadTemplate', () => {
    const columns: DataColumn[] = [
      { key: 'name', header: 'Name' },
      { key: 'status', header: 'Status' },
      { key: 'order', header: 'Order' },
      { key: 'points', header: 'Points' },
      { key: 'level', header: 'Level' },
      { key: 'type', header: 'Type' },
    ];

    it('should download CSV template with example data', () => {
      downloadTemplate(columns, 'questions');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg.content[0]).toContain('your_Name');
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
    });

    it('should generate appropriate example values based on headers', () => {
      const customColumns: DataColumn[] = [
        { key: 'content', header: 'Content' },
        { key: 'custom_status', header: 'Custom Status' },
      ];

      downloadTemplate(customColumns, 'custom');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg.content[0]).toContain('your_Content');
    });
  });

  describe('parseCSV', () => {
    it('should parse simple CSV', () => {
      const csv = 'Name,Age\nJohn,30\nJane,25';
      const result = parseCSV(csv);

      expect(result).toEqual([
        { Name: 'John', Age: '30' },
        { Name: 'Jane', Age: '25' },
      ]);
    });

    it('should parse CSV with quoted values', () => {
      const csv = 'Name,Description\n"Doe, John","A person with, commas"';
      const result = parseCSV(csv);

      expect(result).toEqual([{ Name: 'Doe, John', Description: 'A person with, commas' }]);
    });

    it('should parse CSV with quoted quotes', () => {
      const csv = 'Name,Quote\nJohn,"He said ""Hello"" to me"';
      const result = parseCSV(csv);

      expect(result).toEqual([{ Name: 'John', Quote: 'He said "Hello" to me' }]);
    });

    it('should parse CSV with newlines in quotes', () => {
      const csv = 'Name,Description\nJohn,"Line 1\nLine 2"';
      const result = parseCSV(csv);

      expect(result).toEqual([{ Name: 'John', Description: 'Line 1\nLine 2' }]);
    });

    it('should throw error for CSV with only header', () => {
      const csv = 'Name,Age';

      expect(() => parseCSV(csv)).toThrow('CSV must have at least a header row and one data row');
    });

    it('should throw error for mismatched column counts', () => {
      const csv = 'Name,Age\nJohn,30,Extra';

      expect(() => parseCSV(csv)).toThrow('Row 2 has 3 columns, expected 2');
    });

    it('should handle empty values', () => {
      const csv = 'Name,Age\nJohn,';
      const result = parseCSV(csv);

      expect(result).toEqual([{ Name: 'John', Age: '' }]);
    });

    it('should trim whitespace', () => {
      const csv = 'Name , Age\n  John , 30 ';
      const result = parseCSV(csv);

      expect(result).toEqual([{ Name: 'John', Age: '30' }]);
    });
  });

  describe('parseJSON', () => {
    it('should parse valid JSON array', () => {
      const json = '[{"id": 1, "name": "John"}, {"id": 2, "name": "Jane"}]';
      const result = parseJSON(json);

      expect(result).toEqual([
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ]);
    });

    it('should throw error for non-array JSON', () => {
      const json = '{"id": 1, "name": "John"}';

      expect(() => parseJSON(json)).toThrow('JSON must be an array');
    });

    it('should throw error for invalid JSON', () => {
      const json = 'invalid json';

      expect(() => parseJSON(json)).toThrow();
    });
  });

  describe('readFileAsText', () => {
    it('should read file as text', async () => {
      const file = new File(['test content'], 'test.txt');
      const result = await readFileAsText(file);

      expect(result).toBe('test content');
    });

    it('should handle file read errors', async () => {
      const file = new File([''], 'test.txt');

      // Mock FileReader to simulate error
      const mockFileReader = {
        onload: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
        readAsText: vi.fn().mockImplementation(() => {
          setTimeout(() => {
            if (mockFileReader.onerror) {
              // Invoke with a generic error event and proper this context
              mockFileReader.onerror.call(
                mockFileReader as unknown as FileReader,
                new Event('error') as unknown as ProgressEvent<FileReader>
              );
            }
          }, 0);
        }),
      };

      global.FileReader = vi
        .fn()
        .mockImplementation(() => mockFileReader) as unknown as typeof FileReader;

      await expect(readFileAsText(file)).rejects.toThrow('Failed to read file');
    });
  });

  describe('downloadFile', () => {
    it('should download file with correct parameters', () => {
      downloadFile('test content', 'test.txt', 'text/plain');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg.content).toEqual(['test content']);
      expect(blobArg.options.type).toBe('text/plain');
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob-url');
    });

    it('should handle different MIME types', () => {
      downloadFile('{"test": true}', 'data.json', 'application/json');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg.options.type).toBe('application/json');
    });
  });

  describe('helper functions', () => {
    it('should handle complex CSV parsing scenarios', () => {
      const complexCsv =
        'Name,"Description with ""quotes"" and, commas",Age\n' +
        '"Doe, John","Complex ""description"", here",30\n' +
        'Jane,"Simple description",25';

      const result = parseCSV(complexCsv);

      expect(result).toEqual([
        {
          Name: 'Doe, John',
          'Description with "quotes" and, commas': 'Complex "description", here',
          Age: '30',
        },
        {
          Name: 'Jane',
          'Description with "quotes" and, commas': 'Simple description',
          Age: '25',
        },
      ]);
    });

    it('should handle empty lines in CSV', () => {
      const csvWithEmptyLines = 'Name,Age\n\nJohn,30\n\nJane,25\n';
      const result = parseCSV(csvWithEmptyLines);

      expect(result).toEqual([
        { Name: '', Age: '' },
        { Name: 'John', Age: '30' },
        { Name: '', Age: '' },
        { Name: 'Jane', Age: '25' },
        { Name: '', Age: '' },
      ]);
    });
  });
});
