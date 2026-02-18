import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { SortableHeader } from '@/components/ui/sortable-header';
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
    CheckSquare,
    Key,
    Search,
    Shield,
    ShieldAlert,
    Square,
    UserCheck,
    UserCog,
    Users,
    UserX,
    X,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type AdminUser = Tables<'profiles'>;

function formatDate(dateString: string): string {
  if (!dateString) return '—';
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
        className={cn(
          'even:bg-gray-50/40',
          user.deleted_at && 'opacity-40'
        )}
      >
        <TableCell className="px-3 w-8">
          <button
            onClick={() => onSelect(user.id)}
            disabled={user.id === currentUserId}
            className={cn(
              user.id === currentUserId
                ? 'text-gray-200 cursor-not-allowed'
                : 'text-gray-300 hover:text-gray-500'
            )}
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-teal-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        </TableCell>
        <TableCell className="px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 shrink-0">
              <span className="text-teal-700 font-semibold text-sm">
                {(user.full_name || user.email)?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-gray-900 text-xs truncate">
                  {user.full_name || 'No name'}
                </span>
                {user.id === currentUserId && (
                  <span className="px-1.5 py-0.5 rounded bg-teal-600 text-white text-[9px] font-semibold uppercase">
                    You
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 font-mono truncate">{user.email}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          {user.role === 'super_admin' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 rounded-full text-[11px] font-medium text-purple-700">
              <ShieldAlert className="w-3 h-3" />
              Super Admin
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 rounded-full text-[11px] font-medium text-emerald-700">
              <Shield className="w-3 h-3" />
              Admin
            </span>
          )}
        </TableCell>
        {isSuperAdmin && (
          <TableCell className="hidden lg:table-cell">
            {user.app_id ? (
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                {apps.find((app) => app.app_id === user.app_id)?.display_name || user.app_id}
              </span>
            ) : (
              <span className="text-xs text-gray-400">—</span>
            )}
          </TableCell>
        )}
        <TableCell className="hidden md:table-cell">
          <span className="text-xs text-gray-500">
            {formatDate(user.created_at)}
          </span>
        </TableCell>
        <TableCell>
          <StatusBadge
            status={user.deleted_at ? 'inactive' : 'active'}
          />
        </TableCell>
        <TableCell className="px-4 text-right border-l border-gray-100">
          {user.id !== currentUserId && (
            <>
              {user.deleted_at ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReactivate(user.id)}
                  className="h-7 px-2 rounded text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                >
                  <UserCheck className="h-3 w-3" />
                  Reactivate
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeactivate(user.id)}
                  className="h-7 px-2 rounded text-xs text-red-500 hover:text-red-700 hover:bg-red-50 gap-1"
                >
                  <UserX className="h-3 w-3" />
                  Deactivate
                </Button>
              )}
            </>
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
  const [sortBy, setSortBy] = useState<keyof AdminUser>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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

      if (userRole !== 'super_admin') {
        query = query.in('role', ['admin']);
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setUsers((data as AdminUser[]) || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to retrieve user directory');
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

        const { error: revokeError } = await supabase.functions.invoke('revoke-user-sessions', {
          body: { userId },
        });

        if (revokeError) {
          console.error('Failed to revoke user sessions:', revokeError);
        }

        toast({
          title: 'User Deactivated',
          description: 'Access has been revoked and all sessions terminated.',
        });
        fetchUsers();
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to deactivate user',
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

        toast({ title: 'User Reactivated', description: 'Access has been restored.' });
        fetchUsers();
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to restore user access',
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
          title: 'Batch Complete',
          description: `${ids.length} user(s) ${status === 'deactivate' ? 'deactivated' : 'reactivated'}.`,
        });
        setSelectedIds(new Set());
        fetchUsers();
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Operation failed for one or more users.',
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

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const result = aValue < bValue ? -1 : 1;
      return sortOrder === 'asc' ? result : -result;
    });
  }, [filteredUsers, sortBy, sortOrder]);

  const activeUsersCount = users.filter((u) => !u.deleted_at).length;
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column as keyof AdminUser);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = useCallback(() => {
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

  const colSpan = isSuperAdmin ? 7 : 6;

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
      <AdminHeader
        title="Users"
        description="Manage system access."
        icon={UserCog}
        className="mb-2"
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-lg">
            <Users className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-xs font-semibold text-teal-700">
              {activeUsersCount} active
            </span>
          </div>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

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
              onClick={() => handleBulkToggleStatus('reactivate')}
              className="h-7 px-3 rounded text-xs text-teal-200 hover:text-white hover:bg-white/10 gap-1"
            >
              <UserCheck className="h-3 w-3" />
              Reactivate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkToggleStatus('deactivate')}
              className="h-7 px-3 rounded text-xs text-red-400 hover:text-white hover:bg-red-600 gap-1"
            >
              <UserX className="h-3 w-3" />
              Deactivate
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

      <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
        {/* Card Header: Search + Count */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
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
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
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
                  {selectedIds.size > 0 &&
                  selectedIds.size ===
                    paginatedUsers.filter((u) => u.id !== currentUserId).length ? (
                    <CheckSquare className="h-4 w-4 text-teal-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </TableHead>
              <TableHead className="px-4">
                <SortableHeader
                  label="User"
                  column="full_name"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  label="Role"
                  column="role"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
              </TableHead>
              {isSuperAdmin && (
                <TableHead className="hidden lg:table-cell">
                  <SortableHeader
                    label="Application"
                    column="app_id"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
              )}
              <TableHead className="hidden md:table-cell">
                <SortableHeader
                  label="Date Added"
                  column="created_at"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                Status
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
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-3.5 bg-gray-200 rounded w-24 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded-full w-16 animate-pulse" />
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell className="hidden lg:table-cell">
                      <div className="h-3.5 bg-gray-200 rounded w-20 animate-pulse" />
                    </TableCell>
                  )}
                  <TableCell className="hidden md:table-cell">
                    <div className="h-3.5 bg-gray-200 rounded w-20 animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded-full w-14 animate-pulse" />
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="h-7 w-20 bg-gray-200 rounded animate-pulse ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="py-20">
                  <EmptyState
                    icon={UserX}
                    title={searchQuery ? 'No matches found' : 'No users found'}
                    description={
                      searchQuery
                        ? `No users match "${searchQuery}".`
                        : 'Create an invitation code to onboard new users.'
                    }
                    action={
                      !searchQuery ? (
                        <Link to="/invitation-codes">
                          <Button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm gap-1.5">
                            <Key className="h-3.5 w-3.5" />
                            Generate Invitation Code
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          onClick={() => {
                            setSearchQuery('');
                            setCurrentPage(1);
                          }}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                        >
                          Clear Search
                        </Button>
                      )
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

        {filteredUsers.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
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
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 w-fit">
          <UserX className="w-3.5 h-3.5 text-gray-400" />
          <p className="text-[11px] text-gray-500">
            {users.filter((u) => u.deleted_at).length} deactivated user(s) shown
          </p>
        </div>
      )}
    </div>
  );
}
