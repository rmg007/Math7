/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { History, Calendar, Package } from 'lucide-react';

interface PublishHistory {
  version: number;
  published_at: string;
  domains_count: number;
  skills_count: number;
  questions_count: number;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function VersionHistoryPage() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['publish-history'],
    queryFn: async (): Promise<PublishHistory[]> => {
      const { data, error } = await supabase
        .from('curriculum_snapshots')
        .select('version, published_at, domains_count, skills_count, questions_count')
        .order('version', { ascending: false })
        .limit(10);

      if (error) {
        console.warn('No publish history table found or error:', error);
        return [];
      }
      return (data as any[]) || [];
    },
  });

  const { data: currentMeta } = useQuery({
    queryKey: ['curriculum-meta'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('curriculum_meta')
        .select('version, last_published_at')
        .eq('id', 'singleton')
        .single();

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Version History</h1>
        <p className="text-muted-foreground">
          View past published versions of the curriculum.
        </p>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Current Version</h3>
            <p className="text-purple-100">
              v{(currentMeta as any)?.version ?? 0}
              {(currentMeta as any)?.last_published_at && (
                <span className="ml-2 text-sm">
                  (Published {formatDate((currentMeta as any).last_published_at)})
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-500">Loading version history...</p>
            </div>
          </div>
        ) : !history?.length ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <History className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No version history available</p>
            <p className="text-sm text-gray-400">Publish your curriculum to create the first version.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.map((item: PublishHistory) => (
              <div key={item.version} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100">
                      <span className="text-purple-700 font-bold">v{item.version}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {formatDate(item.published_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{item.domains_count}</p>
                      <p className="text-gray-500">Domains</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{item.skills_count}</p>
                      <p className="text-gray-500">Skills</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{item.questions_count}</p>
                      <p className="text-gray-500">Questions</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
