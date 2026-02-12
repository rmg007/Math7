import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { SortableHeader } from '@/components/ui/sortable-header';
import { useApp } from '@/hooks/use-app';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Calendar, Download, Eye, History, Package } from 'lucide-react';
import { useState } from 'react';
import { usePaginatedPublishHistory } from '../hooks/use-publish';

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
  const [selectedVersion, setSelectedVersion] = useState<{
    version: number;
    published_at: string;
    domains_count: number;
    skills_count: number;
    questions_count: number;
  } | null>(null);

  const {
    data: paginatedHistory,
    isLoading,
    isError,
    error: historyError,
  } = usePaginatedPublishHistory({
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
        <h1 className="text-3xl font-bold tracking-tight">
          Version History (V{currentMeta?.version ?? 0})
        </h1>
        <p className="text-muted-foreground">View past published versions of the curriculum.</p>
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
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-red-500">
            <AlertCircle className="w-12 h-12 mb-4" />
            <p className="font-semibold">Error loading history</p>
            <p className="text-sm opacity-80">
              {(historyError as Error)?.message || 'Unknown error'}
            </p>
          </div>
        ) : !history?.length ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <History className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No version history available</p>
            <p className="text-sm text-gray-400">
              Publish your curriculum to create the first version.
            </p>
          </div>
        ) : (
          <div>
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-100 w-fit">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Results:
                </span>
                <span className="text-xs font-bold text-gray-700">{totalCount}</span>
              </div>
            </div>
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
                    <th className="text-center px-6 py-4 font-semibold text-gray-600 text-sm">
                      Domains
                    </th>
                    <th className="text-center px-6 py-4 font-semibold text-gray-600 text-sm">
                      Skills
                    </th>
                    <th className="text-center px-6 py-4 font-semibold text-gray-600 text-sm">
                      Questions
                    </th>
                    <th className="text-right px-6 py-4 font-semibold text-gray-600 text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history?.map((snapshot, index) => (
                    <tr
                      key={snapshot.version}
                      className="group hover:bg-purple-50/30 transition-colors animate-slide-up cursor-pointer"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                      onClick={() => setSelectedVersion(snapshot)}
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
                        <span className="font-semibold text-gray-900">
                          {snapshot.domains_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-gray-900">{snapshot.skills_count}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-gray-900">
                          {snapshot.questions_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExport(snapshot.version);
                          }}
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

      <Dialog open={Boolean(selectedVersion)} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="rounded-[2.5rem] border-none bg-white/90 backdrop-blur-2xl p-10 shadow-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight italic flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/10">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              Version v{selectedVersion?.version} Details
            </DialogTitle>
          </DialogHeader>

          {selectedVersion && (
            <div className="space-y-6 mt-6">
              <div className="bg-gray-50/50 border border-gray-100/50 p-6 rounded-[2rem]">
                <h4 className="font-black text-sm text-gray-900 uppercase tracking-widest mb-4">
                  Publication Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                      Version
                    </div>
                    <div className="text-lg font-black text-purple-600">
                      v{selectedVersion.version}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                      Published Date
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {formatDate(selectedVersion.published_at)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50/50 border border-indigo-100/50 p-6 rounded-[2rem]">
                <h4 className="font-black text-sm text-indigo-900 uppercase tracking-widest mb-4">
                  Content Summary
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-black text-purple-600">
                      {selectedVersion.domains_count}
                    </div>
                    <div className="text-xs font-black text-gray-500 uppercase tracking-widest">
                      Domains
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-blue-600">
                      {selectedVersion.skills_count}
                    </div>
                    <div className="text-xs font-black text-gray-500 uppercase tracking-widest">
                      Skills
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-amber-600">
                      {selectedVersion.questions_count}
                    </div>
                    <div className="text-xs font-black text-gray-500 uppercase tracking-widest">
                      Questions
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  onClick={() => {
                    handleExport(selectedVersion.version);
                    setSelectedVersion(null);
                  }}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black rounded-[1.5rem] transition-all duration-300 shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transform active:scale-95"
                >
                  <Download className="w-5 h-5" />
                  <span className="text-sm uppercase tracking-[0.2em]">Download Full JSON</span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
