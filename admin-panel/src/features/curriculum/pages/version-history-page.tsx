import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { useApp } from '@/hooks/use-app';
import { History, Calendar, Package, Download } from 'lucide-react';
import { useState } from 'react';
import { usePaginatedPublishHistory } from '../hooks/use-publish';
import { Pagination } from '@/components/ui/pagination';
import { SortableHeader } from '@/components/ui/sortable-header';

type CurriculumMeta = Database['public']['Tables']['curriculum_meta']['Row'];

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
  const { currentApp } = useApp();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('version');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: paginatedHistory, isLoading } = usePaginatedPublishHistory({
    page,
    pageSize,
    sortBy,
    sortOrder,
  });

  const history = paginatedHistory?.data || [];
  const totalCount = paginatedHistory?.totalCount || 0;
  const totalPages = paginatedHistory?.totalPages || 1;

  const { data: currentMeta } = useQuery({
    queryKey: ['curriculum-meta', currentApp?.app_id],
    queryFn: async (): Promise<CurriculumMeta | null> => {
      if (!currentApp?.app_id) return null;

      const { data, error } = await supabase
        .from('curriculum_meta')
        .select('version, last_published_at')
        .eq('app_id', currentApp.app_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching curriculum meta:', error.message || error);
        return null;
      }
      return data as CurriculumMeta | null;
    },
    enabled: Boolean(currentApp?.app_id),
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleExport = async (version: number) => {
    if (!currentApp?.app_id) return;
    try {
      const { data, error } = await supabase
        .from('curriculum_snapshots')
        .select('content')
        .eq('app_id', currentApp.app_id)
        .eq('version', version)
        .single();

      if (error) throw error;
      if (!data?.content) {
        alert('No content found for this version');
        return;
      }

      const blob = new Blob([JSON.stringify(data.content, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `questerix-curriculum-v${version}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export version data');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Version History (V{currentMeta?.version ?? 0})</h1>
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
              v{currentMeta?.version ?? 0}
              {currentMeta?.last_published_at && (
                <span className="ml-2 text-sm">
                  (Published {formatDate(currentMeta.last_published_at)})
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
          <div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-4">
                      <SortableHeader
                        label="Version"
                        column="version"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="text-left px-6 py-4">
                      <SortableHeader
                        label="Published At"
                        column="published_at"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="text-center px-6 py-4 font-semibold text-gray-600 text-sm">Domains</th>
                    <th className="text-center px-6 py-4 font-semibold text-gray-600 text-sm">Skills</th>
                    <th className="text-center px-6 py-4 font-semibold text-gray-600 text-sm">Questions</th>
                    <th className="text-right px-6 py-4 font-semibold text-gray-600 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history?.map((snapshot, index) => (
                  <tr 
                    key={snapshot.version} 
                    className="group hover:bg-purple-50/30 transition-colors animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                  >
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100">
                          <span className="text-purple-700 font-bold">v{snapshot.version}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(snapshot.published_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-gray-900">{snapshot.domains_count}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-gray-900">{snapshot.skills_count}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-gray-900">{snapshot.questions_count}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleExport(snapshot.version)}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                          title="Export JSON"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
