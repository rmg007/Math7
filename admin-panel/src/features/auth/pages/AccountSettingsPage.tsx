import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatIdentifier } from "@/lib/utils"
import type { Tables } from '@/lib/database.types'
import { AdminHeader } from "@/components/ui/admin-header"
import { User, Shield, Calendar, Mail, AlertTriangle, Trash2, ShieldAlert, BadgeCheck } from "lucide-react"

type UserProfile = Tables<'profiles'>

export function AccountSettingsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        if (profile) {
          setUser(profile)
        } else {
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || null,
            role: 'admin',
            created_at: authUser.created_at,
            app_id: null,
            avatar_url: null,
            deleted_at: null,
            updated_at: authUser.created_at,
          })
        }
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  const handleDeactivateAccount = async () => {
    setActionLoading(true)
    setError(null)
    
    try {
      const { error: rpcError } = await supabase.rpc('deactivate_own_account')
      
      if (rpcError) {
        throw rpcError
      }
      
      await supabase.auth.signOut()
      navigate('/login')
    } catch (err) {
      setError('Failed to deactivate account. Please try again.')
      console.error('Deactivate error:', err)
      setActionLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type DELETE to confirm')
      return
    }
    
    setActionLoading(true)
    setError(null)
    
    try {
      const { error: rpcError } = await supabase.rpc('delete_own_account')
      
      if (rpcError) {
        throw rpcError
      }
      
      await supabase.auth.signOut()
      navigate('/login')
    } catch (err) {
      setError('Failed to delete account. Please contact support.')
      console.error('Delete error:', err)
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-8 max-w-4xl mx-auto">
        <div className="h-20 bg-gray-100/50 rounded-2xl w-2/3"></div>
        <div className="h-48 bg-gray-100/50 rounded-2xl"></div>
        <div className="h-48 bg-gray-100/50 rounded-2xl"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
      <AdminHeader 
        title="Account Settings"
        description="Manage your professional profile, security preferences, and account status"
        icon={User}
        breadcrumbs={[
          { label: 'Platform', href: '/apps' },
          { label: 'Security', href: '/settings' },
          { label: 'Profile', href: '/settings' }
        ]}
      />

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-3 animate-in shake duration-500">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-700 font-bold tracking-tight">{error}</p>
        </div>
      )}

      {/* Profile Information Section */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/20 p-10 shadow-sm hover:shadow-xl transition-all">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/10">
            <BadgeCheck className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Identity & Role</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verified profile details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-400">
               <User className="w-3.5 h-3.5" />
               <label className="text-[10px] font-black uppercase tracking-[0.2em]">Legal Name</label>
            </div>
            <p className="text-lg font-bold text-gray-900 tracking-tight ml-5.5">{user?.full_name || 'Anonymous Operator'}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-400">
               <Mail className="w-3.5 h-3.5" />
               <label className="text-[10px] font-black uppercase tracking-[0.2em]">Contact Email</label>
            </div>
            <p className="text-lg font-bold text-gray-900 tracking-tight ml-5.5">{user?.email}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-400">
               <Shield className="w-3.5 h-3.5" />
               <label className="text-[10px] font-black uppercase tracking-[0.2em]">Access Authority</label>
            </div>
            <p className="text-lg font-black text-indigo-600 tracking-tight ml-5.5 uppercase italic">{formatIdentifier(user?.role)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-400">
               <Calendar className="w-3.5 h-3.5" />
               <label className="text-[10px] font-black uppercase tracking-[0.2em]">Enlistment Date</label>
            </div>
            <p className="text-lg font-bold text-gray-900 tracking-tight ml-5.5">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Archive Initialized'}
              {user?.created_at && (
                <span className="text-xs text-gray-400 font-medium ml-2 font-mono tracking-tighter">
                  ({new Date(user.created_at).toLocaleDateString()})
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone Sections */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
            <ShieldAlert className="w-5 h-5 text-red-500/50" />
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Critical Guardrails (Danger Zone)</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deactivation Card */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-amber-500/10 hover:border-amber-500/20 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between p-10">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                  <BadgeCheck className="h-6 w-6 opacity-20" />
                </div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">Deactivate Access</h2>
              </div>
              <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
                Temporarily suspend your authority and access. Your data remains archived and can be restored via administrative override.
              </p>
            </div>
            
            {!showDeactivateConfirm ? (
              <Button
                onClick={() => setShowDeactivateConfirm(true)}
                variant="outline"
                className="w-full h-12 rounded-2xl border-amber-500/20 text-amber-600 hover:bg-amber-50/50 font-black text-xs uppercase tracking-widest transition-all"
              >
                Request Deactivation
              </Button>
            ) : (
              <div className="bg-amber-500/5 backdrop-blur-md border border-amber-500/20 rounded-2xl p-6 space-y-4 animate-in zoom-in-95 duration-300">
                <p className="text-xs font-bold text-amber-800 leading-relaxed uppercase tracking-tight">
                  CONFIRM ACCESS SUSPENSION? YOU WILL BE TERMINATED FROM THE ACTIVE SESSION IMMEDIATELY.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleDeactivateAccount}
                    disabled={actionLoading}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest h-10 shadow-lg shadow-amber-600/20"
                  >
                    {actionLoading ? 'SUSPENDING...' : 'YES, TERMINATE ACCESS'}
                  </Button>
                  <Button
                    onClick={() => setShowDeactivateConfirm(false)}
                    variant="ghost"
                    className="w-full py-2 text-xs font-black text-amber-400 hover:text-amber-600 uppercase tracking-widest"
                    disabled={actionLoading}
                  >
                    Abort Action
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Delete Card */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-red-500/10 hover:border-red-500/20 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between p-10">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600">
                  <Trash2 className="h-6 w-6 opacity-20" />
                </div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">Erase Identity</h2>
              </div>
              <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
                Permanently purge your digital signature and all associated telemetry. <span className="text-red-600 font-black">This execution is irreversible.</span>
              </p>
            </div>
            
            {!showDeleteConfirm ? (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                className="w-full h-12 rounded-2xl border-red-500/20 text-red-600 hover:bg-red-50/50 font-black text-xs uppercase tracking-widest transition-all"
              >
                Initialize Purge
              </Button>
            ) : (
              <div className="bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-2xl p-6 space-y-4 animate-in zoom-in-95 duration-300">
                <p className="text-[10px] font-black text-red-800 leading-relaxed uppercase tracking-widest">
                   Type <span className="bg-red-600 text-white px-1.5 py-0.5 rounded italic">DELETE</span> to authorize absolute erasure.
                </p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="AUTHORIZATION CODE"
                  className="bg-white/50 border-red-200/50 rounded-xl h-10 font-mono font-black text-red-600 text-center tracking-[0.5em] focus:ring-red-500/20"
                />
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={actionLoading || deleteConfirmText !== 'DELETE'}
                    className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest h-10 shadow-lg shadow-red-600/20 disabled:opacity-30"
                  >
                    {actionLoading ? 'EXECUTING...' : 'AUTHORIZE PURGE'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText('')
                    }}
                    variant="ghost"
                    className="w-full py-2 text-xs font-black text-red-400 hover:text-red-600 uppercase tracking-widest"
                    disabled={actionLoading}
                  >
                    Abort Execution
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

