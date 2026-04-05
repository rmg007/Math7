import { useContext } from 'react';
import { BulkImportContext } from '@/contexts/bulk-import-context';

/**
 * useBulkImport Hook
 *
 * Provides access to the global BulkImportContext.
 * Use this hook to interact with the shared import buffer across the app.
 */
export function useBulkImport() {
  const context = useContext(BulkImportContext);
  if (context === undefined) {
    throw new Error('useBulkImport must be used within a BulkImportProvider');
  }
  return context;
}
