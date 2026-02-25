import {
  downloadTemplate,
  exportToCSV,
  exportToJSON,
  parseCSV,
  parseJSON,
  readFileAsText,
  type DataColumn,
} from '@/lib/data-utils';
import { ChevronDown, Download, FileText, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface DataToolbarProps<T extends object> {
  data: T[];
  columns: DataColumn[];
  entityName: string;
  onImport?: (data: Record<string, unknown>[]) => Promise<void>;
  importDisabled?: boolean;
  importDisabledMessage?: string;
}

export function DataToolbar<T extends object>({
  data,
  columns,
  entityName,
  onImport,
  importDisabled = false,
  importDisabledMessage = 'Import is not available',
}: DataToolbarProps<T>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleExportCSV = () => {
    exportToCSV(
      data as unknown as Record<string, unknown>[],
      columns,
      entityName.toLowerCase().replace(/\s+/g, '_')
    );
    setIsOpen(false);
  };

  const handleExportJSON = () => {
    exportToJSON(data, entityName.toLowerCase().replace(/\s+/g, '_'));
    setIsOpen(false);
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(columns, entityName.toLowerCase().replace(/\s+/g, '_'));
    setIsOpen(false);
  };

  const handleUploadClick = () => {
    if (importDisabled) {
      alert(importDisabledMessage);
      return;
    }
    setIsOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImport) return;

    setImporting(true);
    try {
      const content = await readFileAsText(file);
      let parsedData: Record<string, unknown>[];

      if (file.name.endsWith('.csv')) {
        parsedData = parseCSV(content);
      } else if (file.name.endsWith('.json')) {
        parsedData = parseJSON<Record<string, unknown>>(content);
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

  const itemClass =
    'w-full px-3 py-1.5 text-left text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center h-9 px-3 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 gap-1.5"
      >
        Actions
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 w-44 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
          {/* Import / Upload */}
          <button
            onClick={handleUploadClick}
            disabled={importing || importDisabled}
            className={itemClass + (importDisabled ? ' opacity-40 cursor-not-allowed' : '')}
          >
            <Upload className="h-3.5 w-3.5 text-gray-400" />
            {importing ? 'Importing...' : 'Upload Data'}
          </button>
          <button onClick={handleDownloadTemplate} className={itemClass}>
            <FileText className="h-3.5 w-3.5 text-gray-400" />
            Download Template
          </button>

          {/* Divider */}
          <div className="border-t border-gray-100 my-1" />

          {/* Exports */}
          <button onClick={handleExportCSV} className={itemClass}>
            <Download className="h-3.5 w-3.5 text-gray-400" />
            Export as CSV
          </button>
          <button onClick={handleExportJSON} className={itemClass}>
            <Download className="h-3.5 w-3.5 text-gray-400" />
            Export as JSON
          </button>
        </div>
      )}

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
