import { useRef, useState } from 'react';
import { Download, Upload, FileText, ChevronDown } from 'lucide-react';
import { Button } from './button';
import {
  exportToCSV,
  exportToJSON,
  downloadTemplate,
  parseCSV,
  parseJSON,
  readFileAsText,
  type DataColumn,
} from '@/lib/data-utils';

interface DataToolbarProps<T extends Record<string, unknown>> {
  data: T[];
  columns: DataColumn[];
  entityName: string;
  onImport?: (data: Record<string, string>[] | T[]) => Promise<void>;
  importDisabled?: boolean;
  importDisabledMessage?: string;
}

export function DataToolbar<T extends Record<string, unknown>>({
  data,
  columns,
  entityName,
  onImport,
  importDisabled = false,
  importDisabledMessage = 'Import is not available',
}: DataToolbarProps<T>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExportCSV = () => {
    exportToCSV(data, columns, entityName.toLowerCase().replace(/\s+/g, '_'));
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    exportToJSON(data, entityName.toLowerCase().replace(/\s+/g, '_'));
    setShowExportMenu(false);
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(columns, entityName.toLowerCase().replace(/\s+/g, '_'));
  };

  const handleUploadClick = () => {
    if (importDisabled) {
      alert(importDisabledMessage);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImport) return;

    setImporting(true);
    try {
      const content = await readFileAsText(file);
      let parsedData: Record<string, string>[] | T[];

      if (file.name.endsWith('.csv')) {
        parsedData = parseCSV(content);
      } else if (file.name.endsWith('.json')) {
        parsedData = parseJSON<T>(content);
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON.');
      }

      await onImport(parsedData);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to import file');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Download</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
        {showExportMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowExportMenu(false)}
            />
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              <button
                onClick={handleExportCSV}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Export as CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Export as JSON
              </button>
            </div>
          </>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleUploadClick}
        disabled={importing || importDisabled}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        <span className="hidden sm:inline">{importing ? 'Importing...' : 'Upload'}</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadTemplate}
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        <span className="hidden sm:inline">Template</span>
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
