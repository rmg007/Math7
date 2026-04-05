import { createContext, type ChangeEvent, type Dispatch, type SetStateAction } from 'react';
import type { QueuedQuestion } from '@/lib/validation/import-schema';

export interface BulkImportContextType {
  importQueue: QueuedQuestion[];
  setImportQueue: Dispatch<SetStateAction<QueuedQuestion[]>>;
  isProcessing: boolean;
  isDryRun: boolean;
  setIsDryRun: (value: boolean) => void;
  progress: number;
  handleFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  processImport: () => Promise<void>;
  addToQueue: (questions: QueuedQuestion[]) => void;
  clearQueue: () => void;
}

export const BulkImportContext = createContext<BulkImportContextType | undefined>(undefined);
