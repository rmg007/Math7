import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface QueuedQuestion {
  skill_id: string;
  type: 'multiple_choice' | 'text_input' | 'boolean';
  content: string;
  options: any;
  solution: any;
  explanation?: string;
  points: number;
  is_published: boolean;
}

export function useBulkImport() {
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const importQuestions = async (questions: QueuedQuestion[]) => {
    setImporting(true);
    try {
      const { error } = await (supabase as any).rpc('import_questions_bulk', {
        questions_data: questions as any // Pending type generation
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully imported ${questions.length} questions.`
      });
      return true;
    } catch (err: any) {
      console.error('Import failed:', err);
      toast({
        title: "Import Failed",
        description: err.message || 'Unknown error',
        variant: "destructive"
      });
      return false;
    } finally {
      setImporting(false);
    }
  };

  return {
    importQuestions,
    importing
  };
}
