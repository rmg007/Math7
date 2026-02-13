import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge, type StatusType } from '@/components/ui/status-badge';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { Activity, Copy, Key, Power, Search, ShieldCheck, X, Zap } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
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
  if (!dateStr) return 'INF';
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

    return (
      <TableRow
        key={code.id}
        className="group hover:bg-indigo-50/30 transition-colors border-b border-gray-50/50 last:border-0"
      >
        <TableCell className="pl-8 pr-2 py-5">
          <button
            onClick={() => onSelect(code.id)}
            className="text-gray-300 hover:text-indigo-600 transition-colors"
          >
            {isSelected ? (
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
            ) : (
              <Activity className="h-5 w-5 opacity-20" />
            )}
          </button>
        </TableCell>
        <TableCell className="py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-indigo-600" />
            </div>
            <code className="px-4 py-2 rounded-xl bg-gray-100/50 text-indigo-600 font-mono text-sm font-black tracking-widest">
              {code.code}
            </code>
          </div>
        </TableCell>
        <TableCell className="py-5">
          {(() => {
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
            return <StatusBadge status={status} label={label} />;
          })()}
        </TableCell>
        <TableCell className="py-5 font-black text-xs text-gray-600 tracking-tight">
          {code.times_used} / {code.max_uses}
        </TableCell>
        <TableCell className="py-5 font-black text-xs text-gray-400 uppercase tracking-tighter">
          {formatDate(code.expires_at)}
        </TableCell>
        <TableCell className="py-5 font-black text-[10px] text-gray-400 uppercase tracking-widest">
          {formatDate(code.created_at)}
        </TableCell>
        <TableCell className="px-8 py-5 text-right space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(code.code, code.id)}
            className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 gap-2"
          >
            <Copy className="h-3.5 w-3.5" />
            {copiedId === code.id ? 'COPIED' : 'COPY'}
          </Button>
          {code.is_active && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeactivate(code.id)}
              className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-red-400 hover:bg-red-50 hover:text-red-600 gap-2"
            >
              <Power className="h-3.5 w-3.5" />
              VOID
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  }
);

export function InvitationCodesPage() {
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [maxUses, setMaxUses] = useState('1');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expiresDays, setExpiresDays] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredCodes = codes.filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedCodes = filteredCodes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.all(
        ids.map((id) => supabase.rpc('deactivate_invitation_code', { p_code_id: id }))
      );

      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw new Error('Some codes failed to deactivate');

      setSuccess(`${ids.length - errors.length} codes successfully deactivated.`);
      setSelectedIds(new Set());
      await fetchCodes();
    } catch (err) {
      setError('Bulk deactivation process encountered errors.');
      console.error(err);
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
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
      <AdminHeader
        title="Admin Invitation Registry"
        description="Provision and manage high-authority access tokens for new administrative operators."
        icon={Key}
        breadcrumbs={[
          { label: 'Admin', href: '/users' },
          { label: 'Invitations', href: '/invitation-codes' },
        ]}
      />

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-3 animate-in shake duration-500">
          <Activity className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-700 font-bold tracking-tight">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-3 animate-in zoom-in-95 duration-500">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <p className="text-sm text-emerald-700 font-bold tracking-tight">{success}</p>
        </div>
      )}

      {/* Generator Section */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-sm border border-white/20 hover:shadow-md transition-all">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/10">
            <Zap className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Provision Access</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
              Generate new invitation codes for admin onboarding
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-8 items-end">
          <div className="space-y-2 group">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
              Authority Uses
            </label>
            <Input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="w-32 h-12 rounded-xl border-gray-100 bg-gray-50/50 font-black text-indigo-600 focus:bg-white transition-all ring-0 shadow-none border"
              placeholder="1"
            />
          </div>
          <div className="space-y-2 group">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
              TTL (Days)
            </label>
            <Input
              type="number"
              min="1"
              value={expiresDays}
              onChange={(e) => setExpiresDays(e.target.value)}
              className="w-32 h-12 rounded-xl border-gray-100 bg-gray-50/50 font-black text-indigo-600 focus:bg-white transition-all ring-0 shadow-none border"
              placeholder="INF"
            />
          </div>
          <Button
            onClick={handleGenerateCode}
            disabled={generating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-10 h-12 shadow-lg shadow-indigo-600/20 font-black text-xs uppercase tracking-[0.2em] transition-all hover:-translate-y-0.5"
          >
            {generating ? 'GENERATING...' : 'GENERATE CODE'}
          </Button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/20 p-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search active signatures by code value..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-100 bg-white/50 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/10 rounded-xl flex items-center gap-2">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
              Signatures:
            </span>
            <span className="text-sm font-black text-indigo-700 tracking-tight">
              {filteredCodes.length} REGISTERED
            </span>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-600/20 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4 pl-4">
            <span className="text-white font-black text-xs uppercase tracking-[0.2em]">
              {selectedIds.size} SELECTED FOR BATCH PROCESSING
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDeactivate}
              className="h-10 px-6 rounded-xl text-red-100 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all gap-2"
            >
              <Power className="h-4 w-4" />
              Void Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="h-10 px-4 rounded-xl text-indigo-200 font-black text-[10px] uppercase tracking-widest hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-500">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Access Registry</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 italic">
              Verified Invitation Signatures
            </p>
          </div>
          <Activity className="h-5 w-5 text-gray-200" />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b-2 border-gray-100/50">
                <TableHead className="w-12 h-14 pl-8 pr-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-gray-300 hover:text-indigo-600 transition-colors"
                  >
                    {selectedIds.size > 0 && selectedIds.size === paginatedCodes.length ? (
                      <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    ) : (
                      <Activity className="h-5 w-5" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-14">
                  Signature Code
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-14">
                  Status
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-14">
                  Utilization
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-14">
                  Expiration
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-14">
                  Created
                </TableHead>
                <TableHead className="text-right px-8 h-14 font-black text-[10px] uppercase tracking-widest text-gray-400">
                  Execution
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="px-8 py-6">
                      <Skeleton className="h-10 w-full rounded-2xl" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedCodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 p-0">
                    <EmptyState
                      icon={Key}
                      title="No Signatures Found"
                      description={
                        searchQuery
                          ? `No invitation signatures match your search term "${searchQuery}".`
                          : 'Initialize new authorization signatures to populate this registry.'
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
        </div>

        {filteredCodes.length > 0 && (
          <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-100/50">
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
