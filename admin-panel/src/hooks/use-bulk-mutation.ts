import { useApp } from '@/hooks/use-app';
import { supabase } from '@/lib/supabase';
import type { Database } from '@questerix/core/types/database';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type PublicTableName = keyof Database['public']['Tables'];

interface BulkMutationOptions {
  table: PublicTableName;
  idColumn: string;
  invalidateKeys: string[];
}

export function useBulkDelete(options: BulkMutationOptions) {
  const queryClient = useQueryClient();
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');

      let query = supabase
        .from(options.table)
        .update({ deleted_at: new Date().toISOString() })
        .in(options.idColumn, ids);

      if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => options.invalidateKeys.includes(query.queryKey[0] as string),
      });
    },
  });
}

export type BulkUpdateStatusPayload<TStatus> =
  | { ids: string[]; status: TStatus }
  | { skill_ids: string[]; status: TStatus }
  | { question_ids: string[]; status: TStatus };

function resolveBulkUpdateIds<TStatus>(vars: BulkUpdateStatusPayload<TStatus>): string[] {
  if ('ids' in vars) return vars.ids;
  if ('skill_ids' in vars) return vars.skill_ids;
  if ('question_ids' in vars) return vars.question_ids;
  throw new Error('No id list provided for bulk status update');
}

export function useBulkUpdateStatus<TStatus>(options: BulkMutationOptions) {
  const queryClient = useQueryClient();
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async (vars: BulkUpdateStatusPayload<TStatus>) => {
      const ids = resolveBulkUpdateIds(vars);
      const { status } = vars;
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');

      let query = supabase
        .from(options.table)
        .update({ status } as Database['public']['Tables'][typeof options.table]['Update'])
        .in(options.idColumn, ids);

      if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => options.invalidateKeys.includes(query.queryKey[0] as string),
      });
    },
  });
}

export function useBulkCreate(options: Pick<BulkMutationOptions, 'table' | 'invalidateKeys'>) {
  const queryClient = useQueryClient();
  const { currentApp } = useApp();

  return useMutation({
    mutationFn: async (payloads: Record<string, unknown>[]) => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const data = payloads.map((p) => ({
        ...p,
        app_id: currentApp.app_id,
      }));

      const { data: result, error } = await supabase.from(options.table).insert(data).select();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => options.invalidateKeys.includes(query.queryKey[0] as string),
      });
    },
  });
}
