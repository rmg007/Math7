/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

type Domain = Database['public']['Tables']['domains']['Row'];
type DomainInsert = Database['public']['Tables']['domains']['Insert'];
type DomainUpdate = Database['public']['Tables']['domains']['Update'];

export function useDomains() {
  return useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .is('deleted_at', null)
        .order('sort_order');
      
      if (error) throw error;
      return data as Domain[];
    },
  });
}

export function useDomain(id: string) {
    return useQuery({
        queryKey: ['domain', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('domains')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Domain;
        },
        enabled: !!id,
    });
}

export function useCreateDomain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (domain: DomainInsert) => {
      const { data, error } = await (supabase
        .from('domains') as any)
        .insert(domain)
        .select()
        .single();
      
      if (error) throw error;
      return data as Domain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
    },
  });
}

export function useUpdateDomain() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: string } & DomainUpdate) => {
            const { data, error } = await (supabase
                .from('domains') as any)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Domain;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            queryClient.invalidateQueries({ queryKey: ['domain', data.id] });
        },
    });
}

export function useDeleteDomain() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase
                .from('domains') as any)
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);
            
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
        },
    });
}
