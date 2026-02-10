import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Shield, ShieldAlert, UserX, Search, UserCog, X } from 'lucide-react';
import type { Tables } from '@/lib/database.types';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';

type AdminUser = Tables<'profiles'>;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchUsers();
    getCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
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
  };

  const fetchUsers = async () => {
    setLoading(true);
    
    // Get current profile for role check
    const { data: { user: authUser } } = await supabase.auth.getUser();
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

    let query = supabase.from('profiles').select('id, email, full_name, role, created_at, deleted_at');
    
    // Super admins should only see regular admins (and themselves)
    if (userRole === 'super_admin') {
      query = query.or(`role.eq.admin,id.eq.${authUser?.id}`);
    } else {
      query = query.in('role', ['admin']);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers((data as AdminUser[]) || []);
    }
    setLoading(false);
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this admin user?')) return;

    const { error } = await supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      alert('Failed to deactivate user');
    } else {
      fetchUsers();
    }
  };

  const handleReactivate = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ deleted_at: null })
      .eq('id', userId);

    if (error) {
      alert('Failed to reactivate user');
    } else {
      fetchUsers();
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query)
    );
  });

  const activeUsers = filteredUsers.filter((u) => !u.deleted_at);
  const deactivatedUsers = filteredUsers.filter((u) => u.deleted_at);

  return (
    <div className="space-y-6">
      <AdminHeader 
        title="User Management"
        description="Manage administrative users, their roles, and system access levels."
        icon={UserCog}
        actions={
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-700">{activeUsers.length} Active Users</span>
          </div>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-gray-500 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
              {filteredUsers.length} Total
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-500">Loading users...</p>
            </div>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">User</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Role</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Joined</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No admin users found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((user) => (
                    <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${user.deleted_at ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100">
                            <span className="text-purple-700 font-semibold">
                              {(user.full_name || user.email)?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.full_name || 'No name'}
                              {user.id === currentUserId && (
                                <span className="ml-2 text-xs text-purple-600">(You)</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.role === 'super_admin' ? (
                            <>
                              <ShieldAlert className="w-4 h-4 text-purple-600" />
                              <StatusBadge status="active" label="Super Admin" className="bg-purple-100 text-purple-700 hover:bg-purple-100" />
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 text-blue-600" />
                              <StatusBadge status="published" label="Admin" />
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4">
                         <StatusBadge 
                            status={user.deleted_at ? 'inactive' : 'active'} 
                            label={user.deleted_at ? 'Deactivated' : 'Active'}
                          />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.id !== currentUserId && (
                          user.deleted_at ? (
                            <Button
                              variant="ghost"
                              onClick={() => handleReactivate(user.id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              Reactivate
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              onClick={() => handleDeactivate(user.id)}
                              className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <UserX className="h-4 w-4" />
                              Deactivate
                            </Button>
                          )
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {filteredUsers.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredUsers.length / pageSize)}
                totalCount={filteredUsers.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              />
            )}
          </>
        )}
      </div>

      {deactivatedUsers.length > 0 && (
        <p className="text-sm text-gray-500">
          {deactivatedUsers.length} deactivated user(s) shown
        </p>
      )}
    </div>
  );
}
