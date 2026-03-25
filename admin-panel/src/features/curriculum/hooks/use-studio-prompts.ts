import { useApp } from '@/hooks/use-app';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isValidUUID } from '@/lib/utils';

// Supabase client doesn't know about studio_prompts until types are regenerated.
// Using `as any` bridge to bypass — replace once `supabase gen types` is run.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export interface StudioPromptRow {
  id: string;
  app_id: string;
  created_by: string;
  domain_name: string;
  topics: string[];
  question_count: number;
  difficulty_mix: { easy: number; medium: number; hard: number };
  question_types: string[];
  assembled_prompt: string;
  custom_instructions: string | null;
  model_used: string | null;
  token_count: number | null;
  generation_time_ms: number | null;
  questions_generated: number;
  questions_saved: number;
  status: 'generated' | 'saved' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface StudioPromptInsert {
  app_id: string;
  created_by: string;
  domain_name: string;
  topics: string[];
  question_count: number;
  difficulty_mix: { easy: number; medium: number; hard: number };
  question_types: string[];
  assembled_prompt: string;
  custom_instructions?: string;
  model_used?: string;
  token_count?: number;
  generation_time_ms?: number;
  questions_generated?: number;
}

// ─────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────

/** Paginated list of studio prompts for the current app */
export function useStudioPrompts(page = 1, pageSize = 20) {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['studio-prompts', currentApp?.app_id, page, pageSize],
    queryFn: async () => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await db
        .from('studio_prompts')
        .select('*', { count: 'exact' })
        .eq('app_id', currentApp.app_id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data: (data ?? []) as StudioPromptRow[],
        totalCount: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
    enabled: Boolean(currentApp?.app_id) && isValidUUID(currentApp?.app_id),
  });
}

/** Single studio prompt */
export function useStudioPrompt(promptId: string | null) {
  return useQuery({
    queryKey: ['studio-prompt', promptId],
    queryFn: async () => {
      if (!promptId) throw new Error('No prompt ID');

      const { data, error } = await db
        .from('studio_prompts')
        .select('*')
        .eq('id', promptId)
        .single();

      if (error) throw error;
      return data as StudioPromptRow;
    },
    enabled: Boolean(promptId) && isValidUUID(promptId),
  });
}

/** Fetch questions linked to a specific studio prompt */
export function useStudioPromptQuestions(promptId: string | null) {
  return useQuery({
    queryKey: ['studio-prompt-questions', promptId],
    queryFn: async () => {
      if (!promptId) throw new Error('No prompt ID');

      const { data, error } = await db
        .from('questions')
        .select('question_id, content, type, difficulty, status, created_at')
        .eq('studio_prompt_id', promptId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(promptId) && isValidUUID(promptId),
  });
}

/** Create a new studio prompt record */
export function useCreateStudioPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prompt: StudioPromptInsert) => {
      const { data, error } = await db.from('studio_prompts').insert(prompt).select().single();

      if (error) throw error;
      return data as StudioPromptRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-prompts'] });
    },
  });
}

/** Update a studio prompt (e.g. after saving questions) */
export function useUpdateStudioPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<Pick<StudioPromptRow, 'questions_saved' | 'status'>>) => {
      const { data, error } = await db
        .from('studio_prompts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as StudioPromptRow;
    },
    onSuccess: (data: StudioPromptRow) => {
      queryClient.invalidateQueries({ queryKey: ['studio-prompts'] });
      queryClient.invalidateQueries({ queryKey: ['studio-prompt', data.id] });
    },
  });
}
