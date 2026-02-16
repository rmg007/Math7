import Papa from 'papaparse';

export interface DataColumn {
  key: string;
  header: string;
  transform?: (value: unknown) => string;
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: DataColumn[],
  filename: string
): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = columns.map((col) => col.header);
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = item[col.key];
      if (col.transform) {
        return col.transform(value);
      }
      return String(value ?? '');
    })
  );

  const result = Papa.unparse({
    fields: headers,
    data: rows,
  });

  downloadFile(result, `${filename}.csv`, 'text/csv');
}

export function exportToJSON<T>(data: T[], filename: string): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
}

export function downloadTemplate(columns: DataColumn[], filename: string): void {
  const headers = columns.map((col) => col.header);
  const exampleRow = columns.map((col) => {
    if (col.header.toLowerCase().includes('status')) return 'draft';
    if (col.header.toLowerCase().includes('order')) return '1';
    if (col.header.toLowerCase().includes('points')) return '10';
    if (col.header.toLowerCase().includes('level')) return '1';
    if (col.header.toLowerCase().includes('type')) return 'multiple_choice';
    return `your_${col.header}`;
  });

  const result = Papa.unparse({
    fields: headers,
    data: [exampleRow],
  });

  downloadFile(result, `${filename}_template.csv`, 'text/csv');
}

export function parseCSV(csvText: string): Record<string, string>[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  if (result.errors.length > 0) {
    const error = result.errors[0];
    throw new Error(
      `Row ${error.row !== undefined ? error.row + 1 : 'unknown'} has ${error.code} error: ${error.message}`
    );
  }

  if (result.data.length === 0) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  return result.data as Record<string, string>[];
}

export function parseJSON<T>(jsonText: string): T[] {
  const parsed = JSON.parse(jsonText);
  if (!Array.isArray(parsed)) {
    throw new Error('JSON must be an array');
  }
  return parsed;
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
