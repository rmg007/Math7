import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  Activity,
  Fingerprint,
  History,
  Key,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserCog,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type AdminUser = Tables<'profiles'>;

function formatDate(dateString: string): string {
  if (!dateString) return 'UNKNOWN';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface UserRowProps {
  user: AdminUser;
  currentUserId: string | null;
  onSelect: (id: string) => void;
  onDeactivate: (id: string) => void;
  onReactivate: (id: string) => void;
  isSelected: boolean;
  isSuperAdmin: boolean;
  apps: Array<{ app_id: string; display_name: string }>;
}

const UserRow = memo(
  ({
    user,
    currentUserId,
    onSelect,
    onDeactivate,
    onReactivate,
    isSelected,
    isSuperAdmin,
    apps,
  }: UserRowProps) => {
    return (
      <TableRow
        key={user.id}
        className={cn(
          'group hover:bg-indigo-50/30 transition-colors border-b border-gray-50/50 last:border-0',
          user.deleted_at && 'opacity-40 grayscale-[0.5]'
        )}
      >
        <TableCell className="pl-8 pr-2 py-5">
          <button
            onClick={() => onSelect(user.id)}
            disabled={user.id === currentUserId}
            className={cn(
              'transition-colors',
              user.id === currentUserId
                ? 'text-gray-100 cursor-not-allowed'
                : 'text-gray-300 hover:text-indigo-600'
            )}
          >
            {isSelected ? (
              <UserCheck className="h-5 w-5 text-indigo-600" />
            ) : (
              <Activity className="h-5 w-5 opacity-20" />
            )}
          </button>
        </TableCell>
        <TableCell className="py-5">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/10 relative overflow-hidden group-hover:scale-110 transition-transform">
              <span className="text-indigo-700 font-black text-lg relative z-10">
                {(user.full_name || user.email)?.charAt(0).toUpperCase()}
              </span>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-black text-gray-900 tracking-tight text-base italic">
                  {user.full_name || 'ANONYMOUS UNIT'}
                </p>
                {user.id === currentUserId && (
                  <div className="px-1.5 py-0.5 rounded-md bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest">
                    SELF
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-gray-400 mt-0.5">
                <Fingerprint className="w-3 h-3" />
                <p className="text-xs font-bold font-mono tracking-tighter">{user.email}</p>
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="px-6 py-5">
          <div className="flex items-center gap-2">
            {user.role === 'super_admin' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg group/badge transition-all hover:bg-purple-500/20">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest">
                  Level 10 Super
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg group/badge transition-all hover:bg-emerald-500/20">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                  Level 1 Admin
                </span>
              </div>
            )}
          </div>
        </TableCell>
        {isSuperAdmin && (
          <TableCell className="px-6 py-5">
            <div className="flex items-center gap-2">
              {user.app_id ? (
                <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                  {apps.find((app) => app.app_id === user.app_id)?.display_name || user.app_id}
                </span>
              ) : (
                <span className="text-xs font-bold text-gray-400 italic">No App</span>
              )}
            </div>
          </TableCell>
        )}
        <TableCell className="px-6 py-5">
          <div className="flex items-center gap-2 text-gray-400">
            <History className="w-3 h-3" />
            <span className="text-xs font-black uppercase tracking-wider">
              {formatDate(user.created_at)}
            </span>
          </div>
        </TableCell>
        <TableCell className="px-6 py-5">
          <StatusBadge
            status={user.deleted_at ? 'inactive' : 'active'}
            label={user.deleted_at ? 'VOIDED' : 'OPERATIONAL'}
          />
        </TableCell>
        <TableCell className="px-8 py-5 text-right">
          {user.id !== currentUserId && (
            <div>
              {user.deleted_at ? (
                <Button
                  variant="ghost"
                  onClick={() => onReactivate(user.id)}
                  className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 gap-2"
                >
                  <UserCheck className="h-4 w-4" />
                  REINSTATE
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => onDeactivate(user.id)}
                  className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-50 hover:text-red-700 gap-2"
                >
                  <UserX className="h-4 w-4" />
                  DEACTIVATE
                </Button>
              )}
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  }
);

export function UserManagementPage() {
  const { toast } = useToast();
  const { isSuperAdmin, apps } = useApp();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const getCurrentUser = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile) {
        setCurrentUserRole(profile.role);
      }
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current profile for role check
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      let userRole = currentUserRole;

      if (authUser && !userRole) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authUser.id)
          .single();
        userRole = profile?.role || null;
        if (userRole) setCurrentUserRole(userRole);
      }

      let query = supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at, deleted_at, app_id');

      // Super admins can see all users across all tenants
      if (userRole !== 'super_admin') {
        query = query.in('role', ['admin']);
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setUsers((data as AdminUser[]) || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to retrieve operator directory');
    } finally {
      setLoading(false);
    }
  }, [currentUserRole]);

  useEffect(() => {
    const init = async () => {
      await getCurrentUser();
      await fetchUsers();
    };
    init();
  }, [getCurrentUser, fetchUsers]);

  const handleDeactivate = useCallback(
    async (userId: string) => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', userId);

        if (error) throw error;

        // Revoke all active sessions for the user
        const { error: revokeError } = await supabase.functions.invoke('revoke-user-sessions', {
          body: { userId },
        });

        if (revokeError) {
          console.error('Failed to revoke user sessions:', revokeError);
          // Continue anyway - profile is deactivated
        }

        toast({
          title: 'Operator Deactivated',
          description: 'Access has been revoked and all sessions terminated.',
        });
        fetchUsers();
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to deactivate operator',
          variant: 'destructive',
        });
      }
    },
    [toast, fetchUsers]
  );

  const handleReactivate = useCallback(
    async (userId: string) => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ deleted_at: null })
          .eq('id', userId);

        if (error) throw error;

        toast({ title: 'Operator Reinstated', description: 'Access has been restored.' });
        fetchUsers();
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to restore operator access',
          variant: 'destructive',
        });
      }
    },
    [toast, fetchUsers]
  );

  const handleBulkToggleStatus = useCallback(
    async (status: 'deactivate' | 'reactivate') => {
      if (selectedIds.size === 0) return;

      try {
        const ids = Array.from(selectedIds);

        const promises = ids.map((id) =>
          supabase
            .from('profiles')
            .update({ deleted_at: status === 'deactivate' ? new Date().toISOString() : null })
            .eq('id', id)
        );

        const results = await Promise.all(promises);
        const errors = results.filter((r) => r.error);

        if (errors.length > 0) throw new Error('One or more updates failed');

        toast({
          title: `Batch Process Complete`,
          description: `${ids.length} operators ${status === 'deactivate' ? 'deactivated' : 'reinstated'}.`,
        });
        setSelectedIds(new Set());
        fetchUsers();
      } catch (err) {
        toast({
          title: 'Batch Error',
          description: 'Operation failed for one or more operators.',
          variant: 'destructive',
        });
      }
    },
    [selectedIds, toast, fetchUsers]
  );

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) || user.full_name?.toLowerCase().includes(query)
    );
  });

  const activeUsersCount = users.filter((u) => !u.deleted_at).length;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSelectAll = useCallback(() => {
    // Only select users we can actually edit (not self)
    const selectable = paginatedUsers.filter((u) => u.id !== currentUserId);
    if (selectedIds.size === selectable.length && selectable.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectable.map((u) => u.id)));
    }
  }, [paginatedUsers, currentUserId, selectedIds.size]);

  const handleSelectOne = useCallback(
    (id: string) => {
      if (id === currentUserId) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [currentUserId]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
      <AdminHeader
        title="Operator Directory"
        description="Manage admin users and roles."
        icon={UserCog}
        actions={
          <div className="flex items-center gap-3 px-6 py-3 bg-indigo-500/10 border border-indigo-500/10 rounded-2xl">
            <Users className="w-5 h-5 text-indigo-600" />
            <div className="flex flex-col">
              <span className="text-sm font-black text-indigo-700 tracking-tight">
                {activeUsersCount} ACTIVE
              </span>
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                Operators
              </span>
            </div>
          </div>
        }
      />

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-3 animate-in shake duration-500">
          <ShieldAlert className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-700 font-bold tracking-tight">{error}</p>
        </div>
      )}

      {/* Search & Intelligence Bar */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/20 p-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Identify operator by name or secure email..."
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
              Telemetry:
            </span>
            <span className="text-sm font-black text-indigo-700 tracking-tight">
              {filteredUsers.length} RESULTS
            </span>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-600/20 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4 pl-4">
            <span className="text-white font-black text-xs uppercase tracking-[0.2em]">
              {selectedIds.size} SELECTED FOR BATCH MODIFICATION
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkToggleStatus('reactivate')}
              className="h-10 px-6 rounded-xl text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all gap-2"
            >
              <UserCheck className="h-4 w-4" />
              Reinstate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkToggleStatus('deactivate')}
              className="h-10 px-6 rounded-xl text-red-100 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all gap-2"
            >
              <UserX className="h-4 w-4" />
              Deactivate
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
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Active Duty List</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 italic">
              Verified System Personnel
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
                    {selectedIds.size > 0 &&
                    selectedIds.size ===
                      paginatedUsers.filter((u) => u.id !== currentUserId).length ? (
                      <History className="h-5 w-5 text-indigo-600" />
                    ) : (
                      <Activity className="h-5 w-5" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="text-left py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest h-14">
                  Operator Identity
                </TableHead>
                <TableHead className="text-left px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest h-14">
                  Access Tier
                </TableHead>
                {isSuperAdmin && (
                  <TableHead className="text-left px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest h-14">
                    Application
                  </TableHead>
                )}
                <TableHead className="text-left px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest h-14">
                  Enlistment
                </TableHead>
                <TableHead className="text-left px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest h-14">
                  Duty Status
                </TableHead>
                <TableHead className="text-right px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest h-14">
                  Commands
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={isSuperAdmin ? 7 : 6} className="px-8 py-6">
                      <Skeleton className="h-10 w-full rounded-2xl" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 7 : 6} className="py-20 p-0">
                    <EmptyState
                      icon={UserX}
                      title="Zero Operators Detected"
                      description={
                        searchQuery
                          ? `No administrative personnel match your search for "${searchQuery}".`
                          : 'No admin users have registered yet. Generate an invitation code to onboard new admins.'
                      }
                      action={
                        !searchQuery ? (
                          <Link to="/invitation-codes">
                            <Button className="gap-2 rounded-2xl px-6 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                              <Key className="h-4 w-4" />
                              Generate Invitation Code
                            </Button>
                          </Link>
                        ) : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    currentUserId={currentUserId}
                    onSelect={handleSelectOne}
                    onDeactivate={handleDeactivate}
                    onReactivate={handleReactivate}
                    isSelected={selectedIds.has(user.id)}
                    isSuperAdmin={isSuperAdmin}
                    apps={apps}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length > 0 && (
          <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-100/50">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredUsers.length / pageSize)}
              totalCount={filteredUsers.length}
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

      {users.some((u) => u.deleted_at) && (
        <div className="flex items-center gap-2 px-6 py-3 bg-gray-50/50 rounded-2xl border border-gray-100 w-fit">
          <Activity className="w-4 h-4 text-gray-300" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Archive Status: {users.filter((u) => u.deleted_at).length} VOIDED OPERATORS SHOWN
          </p>
        </div>
      )}
    </div>
  );
}
