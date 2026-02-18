import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge, type StatusType } from '@/components/ui/status-badge';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { CheckSquare, Copy, Key, Loader2, Power, Search, Square, X, Zap } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { SortableHeader } from '@/components/ui/sortable-header';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type InvitationCode = Tables<'invitation_codes'>;

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface InvitationCodeRowProps {
  code: InvitationCode;
  onSelect: (id: string) => void;
  onCopy: (code: string, id: string) => void;
  onDeactivate: (id: string) => void;
  isSelected: boolean;
  copiedId: string | null;
}

const InvitationCodeRow = memo(
  ({ code, onSelect, onCopy, onDeactivate, isSelected, copiedId }: InvitationCodeRowProps) => {
    const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
    const isExhausted = (code.times_used ?? 0) >= (code.max_uses ?? 1);

    const status: StatusType = !code.is_active
      ? 'inactive'
      : isExpired
        ? 'error'
        : isExhausted
          ? 'exhausted'
          : 'active';
    const label = !code.is_active
      ? 'Deactivated'
      : isExpired
        ? 'Expired'
        : isExhausted
          ? 'Exhausted'
          : 'Active';

    return (
      <TableRow className="even:bg-gray-50/40">
        <TableCell className="px-3 w-8">
          <button
            onClick={() => onSelect(code.id)}
            className="text-gray-300 hover:text-gray-500"
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-teal-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        </TableCell>
        <TableCell className="px-4">
          <code className="px-2.5 py-1 rounded bg-gray-100 text-teal-700 font-mono text-xs font-semibold tracking-wider">
            {code.code}
          </code>
        </TableCell>
        <TableCell>
          <StatusBadge status={status} label={label} />
        </TableCell>
        <TableCell>
          <span className="text-xs text-gray-600 tabular-nums">
            {code.times_used} / {code.max_uses}
          </span>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <span className="text-xs text-gray-500">
            {formatDate(code.expires_at)}
          </span>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          <span className="text-xs text-gray-500">
            {formatDate(code.created_at)}
          </span>
        </TableCell>
        <TableCell className="px-4 text-right border-l border-gray-100">
          <div className="flex items-center justify-end gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(code.code, code.id)}
              className="h-7 px-2 rounded text-xs text-gray-400 hover:text-teal-600 hover:bg-teal-50 gap-1"
            >
              <Copy className="h-3 w-3" />
              {copiedId === code.id ? 'Copied' : 'Copy'}
            </Button>
            {code.is_active && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeactivate(code.id)}
                className="h-7 px-2 rounded text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 gap-1"
              >
                <Power className="h-3 w-3" />
                Deactivate
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  }
);

export function InvitationCodesPage() {
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [maxUses, setMaxUses] = useState('1');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expiresDays, setExpiresDays] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredCodes = codes.filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedCodes = [...filteredCodes].sort((a, b) => {
    const aValue = a[sortBy as keyof InvitationCode];
    const bValue = b[sortBy as keyof InvitationCode];

    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    const result = aValue < bValue ? -1 : 1;
    return sortOrder === 'asc' ? result : -result;
  });

  const paginatedCodes = sortedCodes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('invitation_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError('Failed to load invitation codes');
      console.error(error);
    } else {
      setCodes((data as InvitationCode[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleGenerateCode = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: newCode, error: genError } = await supabase.rpc('generate_invitation_code', {
        p_max_uses: parseInt(maxUses) || 1,
        p_expires_days: expiresDays ? parseInt(expiresDays) : undefined,
      });

      if (genError) throw genError;

      setSuccess(`New invitation code generated: ${newCode}`);
      await fetchCodes();
      setMaxUses('1');
      setExpiresDays('');
    } catch (err) {
      setError('Failed to generate invitation code. Make sure you are a super admin.');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }, [maxUses, expiresDays, fetchCodes]);

  const handleDeactivateCode = useCallback(
    async (codeId: string) => {
      try {
        const { error: deactError } = await supabase.rpc('deactivate_invitation_code', {
          p_code_id: codeId,
        });

        if (deactError) throw deactError;

        await fetchCodes();
      } catch (err) {
        setError('Failed to deactivate code');
        console.error(err);
      }
    },
    [fetchCodes]
  );

  const handleCopyCode = useCallback(async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(codeId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const handleBulkDeactivate = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setError(null);
    setSuccess(null);
    setDeactivating(true);

    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.all(
        ids.map((id) => supabase.rpc('deactivate_invitation_code', { p_code_id: id }))
      );

      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw new Error('Some codes failed to deactivate');

      setSuccess(`${ids.length - errors.length} code(s) deactivated.`);
      setSelectedIds(new Set());
      await fetchCodes();
    } catch (err) {
      setError('Bulk deactivation encountered errors.');
      console.error(err);
    } finally {
      setDeactivating(false);
    }
  }, [selectedIds, fetchCodes]);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === paginatedCodes.length && paginatedCodes.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedCodes.map((c) => c.id)));
    }
  }, [paginatedCodes, selectedIds.size]);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
      <AdminHeader
        title="Invitation Codes"
        description="Manage access codes."
        icon={Key}
        className="mb-2"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <X className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
          <p className="text-xs text-emerald-700">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-400 hover:text-emerald-600">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Generator Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-md p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-teal-50 border border-teal-100">
            <Zap className="h-4 w-4 text-teal-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Generate Code</h2>
            <p className="text-[11px] text-gray-500">Create a new invitation code for user onboarding</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-600">Max Uses</label>
            <Input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="w-24 h-9 rounded border border-gray-300 bg-white text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm"
              placeholder="1"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-600">Expires (days)</label>
            <Input
              type="number"
              min="1"
              value={expiresDays}
              onChange={(e) => setExpiresDays(e.target.value)}
              className="w-24 h-9 rounded border border-gray-300 bg-white text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm"
              placeholder="Never"
            />
          </div>
          <Button
            onClick={handleGenerateCode}
            disabled={generating}
            className="h-9 px-4 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm gap-1.5"
          >
            {generating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {generating ? 'Generating...' : 'Generate Code'}
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-teal-900 rounded-lg shadow-md">
          <div className="flex items-center gap-3 pl-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-semibold">
              {selectedIds.size}
            </span>
            <span className="text-xs text-teal-200 font-medium">selected</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDeactivate}
              disabled={deactivating}
              className="h-7 px-3 rounded text-xs text-red-400 hover:text-white hover:bg-red-600 gap-1"
            >
              {deactivating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Power className="h-3 w-3" />
              )}
              {deactivating ? 'Deactivating...' : 'Deactivate'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="h-7 px-2 rounded text-xs text-teal-300 hover:text-white hover:bg-white/10"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
        {/* Card Header: Search + Count */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search codes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-1.5 rounded border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 outline-none focus-visible:outline-none text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded"
                title="Clear"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <span className="text-[11px] text-gray-500 whitespace-nowrap">
            {filteredCodes.length} {filteredCodes.length === 1 ? 'code' : 'codes'}
          </span>
        </div>

        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="px-3 w-8">
                <button
                  onClick={handleSelectAll}
                  className="text-gray-300 hover:text-gray-500"
                  title="Select all"
                >
                  {selectedIds.size > 0 && selectedIds.size === paginatedCodes.length ? (
                    <CheckSquare className="h-4 w-4 text-teal-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </TableHead>
              <TableHead className="px-4">
                <SortableHeader
                  label="Code"
                  column="code"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  label="Status"
                  column="is_active"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  label="Usage"
                  column="times_used"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <SortableHeader
                  label="Expires"
                  column="expires_at"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <SortableHeader
                  label="Created"
                  column="created_at"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-right px-4 border-l border-gray-100">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="even:bg-gray-50/40">
                  <TableCell className="px-3">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="h-5 bg-gray-200 rounded w-28 animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded-full w-16 animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-3.5 bg-gray-200 rounded w-12 animate-pulse" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="h-3.5 bg-gray-200 rounded w-20 animate-pulse" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="h-3.5 bg-gray-200 rounded w-20 animate-pulse" />
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="h-7 w-16 bg-gray-200 rounded animate-pulse ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-20">
                  <EmptyState
                    icon={Key}
                    title={searchQuery ? 'No matches found' : 'No invitation codes'}
                    description={
                      searchQuery
                        ? `No codes match "${searchQuery}".`
                        : 'Generate a new code to get started.'
                    }
                    action={
                      searchQuery ? (
                        <Button
                          onClick={() => {
                            setSearchQuery('');
                            setCurrentPage(1);
                          }}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                        >
                          Clear Search
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedCodes.map((code) => (
                <InvitationCodeRow
                  key={code.id}
                  code={code}
                  onSelect={handleSelectOne}
                  onCopy={handleCopyCode}
                  onDeactivate={handleDeactivateCode}
                  isSelected={selectedIds.has(code.id)}
                  copiedId={copiedId}
                />
              ))
            )}
          </TableBody>
        </Table>

        {filteredCodes.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredCodes.length / pageSize)}
              totalCount={filteredCodes.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
