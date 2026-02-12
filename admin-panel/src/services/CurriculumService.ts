import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { QueuedQuestionSchema } from '@/lib/validation/import-schema';

export interface ImportResult {
  success: boolean;
  count: number;
  error?: string;
  isDryRun?: boolean;
}

export class CurriculumService {
  /**
   * Imports questions in bulk with shared validation, error handling, and client-side batching.
   * Covers Implementation Plan Phase 3, tasks 8-12.
   */
  static async importQuestionsBulk(
    questions: unknown[],
    options: { dryRun?: boolean; batchSize?: number } = {}
  ): Promise<ImportResult> {
    const { batchSize = 50, dryRun = false } = options;

    try {
      // 1. Full Validation (Zod)
      // We validate EVERYTHING before starting any database work.
      const validatedQuestions = [];
      for (let i = 0; i < questions.length; i++) {
        const result = QueuedQuestionSchema.safeParse(questions[i]);
        if (!result.success) {
          const errorMsg = result.error.errors
            .map((e) => `${e.path.join('.')}: ${e.message}`)
            .join('; ');
          return {
            success: false,
            count: 0,
            error: `Row ${i + 1} validation failed: ${errorMsg}`,
          };
        }
        validatedQuestions.push(result.data);
      }

      // 2. Dry Run Support
      if (dryRun) {
        return {
          success: true,
          count: validatedQuestions.length,
          isDryRun: true,
        };
      }

      // 3. Batching Logic
      // We split the validated questions into chunks to avoid hitting payload limits.
      let totalInserted = 0;
      const chunks = [];
      for (let i = 0; i < validatedQuestions.length; i += batchSize) {
        chunks.push(validatedQuestions.slice(i, i + batchSize));
      }

      for (let i = 0; i < chunks.length; i++) {
        console.log(`Importing batch ${i + 1} of ${chunks.length}...`);

        type RPCArgs = Database['public']['Functions']['import_questions_bulk']['Args'];
        const { data, error } = await supabase.rpc('import_questions_bulk', {
          questions_data: chunks[i] as unknown as RPCArgs['questions_data'],
        });

        if (error) {
          return {
            success: false,
            count: totalInserted,
            error: `Batch ${i + 1} failed: ${error.message}. ${totalInserted} rows were previously inserted.`,
          };
        }

        const result = data?.[0] || { success: false, inserted_count: 0 };
        if (!result.success) {
          return {
            success: false,
            count: totalInserted,
            error: `Batch ${i + 1} rejected by database: Unknown error. ${totalInserted} rows were previously inserted.`,
          };
        }

        totalInserted += result.inserted_count;
      }

      return {
        success: true,
        count: totalInserted,
      };
    } catch (err: unknown) {
      console.error('CurriculumService.importQuestionsBulk failure:', err);
      return {
        success: false,
        count: 0,
        error:
          err instanceof Error ? err.message : 'An unexpected error occurred during bulk import',
      };
    }
  }
}
