import { useToast } from '@/hooks/use-toast';
import type { QueuedQuestion } from '@/lib/validation/import-schema';
import { CurriculumService } from '@/services/CurriculumService';
import Papa from 'papaparse';
import { useEffect, useRef, useState } from 'react';

const safeJson = <T>(value: string | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

/**
 * useBulkImport Hook
 *
 * Provides a React-friendly interface for bulk-importing questions.
 * Handles queuing, parsing, progress tracking, and dry runs.
 */
export function useBulkImport() {
  const [importQueue, setImportQueue] = useState<QueuedQuestion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [progress, setProgress] = useState(0);
  const progressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (progressTimeoutRef.current) {
        clearTimeout(progressTimeoutRef.current);
      }
    };
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProgress(0);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = (results.data as Record<string, string>[]).map((row, _index) => {
          const type = (row.type || 'multiple_choice') as QueuedQuestion['type'];

          return {
            type,
            content: row.content || '',
            points: parseInt(row.points) || 10,
            difficulty_level: parseInt(row.difficulty_level) || 1,
            skill_id: row.skill_id,
            is_published: true,
            solution: row.solution || row.correct_answer || '',
            metadata: safeJson(row.metadata, {}),
            options:
              type === 'boolean' || type === 'text_input'
                ? null
                : safeJson(row.options, [] as Array<{ text: string; is_correct: boolean }>),
          };
        });

        setImportQueue((prev) => [...prev, ...(parsed as QueuedQuestion[])]);
        toast({
          title: 'File Loaded',
          description: `Queued ${parsed.length} questions from ${file.name}`,
        });
      },
      error: (error) => {
        toast({
          title: 'Parsing Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  const processImport = async () => {
    if (importQueue.length === 0) return;

    setIsProcessing(true);
    setProgress(10); // Start progress

    try {
      const markName = 'useBulkImport:process';
      performance.mark(`${markName}:start`);
      const result = await CurriculumService.importQuestionsBulk(importQueue, {
        dryRun: isDryRun,
        batchSize: 50,
      });
      performance.mark(`${markName}:end`);
      performance.measure(markName, `${markName}:start`, `${markName}:end`);

      setProgress(100);

      if (result.success) {
        toast({
          title: isDryRun ? 'Dry Run Successful' : 'Import Successful',
          description: isDryRun
            ? `All ${result.count} questions passed validation.`
            : `Successfully imported ${result.count} questions.`,
          className: isDryRun ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white',
        });

        if (!isDryRun) {
          setImportQueue([]);
        }
      } else {
        toast({
          title: 'Import Error',
          description: result.error || 'Failed to process import',
          variant: 'destructive',
        });
      }
    } catch (err: unknown) {
      toast({
        title: 'Unexpected Error',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      progressTimeoutRef.current = setTimeout(() => setProgress(0), 1000);
    }
  };

  return {
    importQueue,
    setImportQueue,
    handleFileUpload,
    processImport,
    isProcessing,
    isDryRun,
    setIsDryRun,
    progress,
  };
}
