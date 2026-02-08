import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

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
          .from('profiles' as never)
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        if (profile) {
          setUser(profile as unknown as UserProfile)
        } else {
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || null,
            role: 'admin',
            created_at: authUser.created_at
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
      const { error: rpcError } = await supabase.rpc('deactivate_own_account' as never)
      
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
      const { error: rpcError } = await supabase.rpc('delete_own_account' as never)
      
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account preferences and security</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}


      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Full Name</label>
              <p className="text-gray-900 font-medium">{user?.full_name || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="text-gray-900 font-medium">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Role</label>
              <p className="text-gray-900 font-medium capitalize">{user?.role}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Member Since</label>
              <p className="text-gray-900 font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Deactivate Account</h2>
        <p className="text-gray-500 text-sm mb-4">
          Temporarily disable your account. You can reactivate it later by contacting support.
        </p>
        
        {!showDeactivateConfirm ? (
          <Button
            onClick={() => setShowDeactivateConfirm(true)}
            variant="outline"
            className="border-orange-300 text-orange-600 hover:bg-orange-50"
          >
            Deactivate Account
          </Button>
        ) : (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
            <p className="text-sm text-orange-800">
              Are you sure you want to deactivate your account? You will be logged out immediately.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleDeactivateAccount}
                disabled={actionLoading}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {actionLoading ? 'Deactivating...' : 'Yes, Deactivate'}
              </Button>
              <Button
                onClick={() => setShowDeactivateConfirm(false)}
                variant="outline"
                disabled={actionLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Delete Account</h2>
        <p className="text-gray-500 text-sm mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        
        {!showDeleteConfirm ? (
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Delete Account
          </Button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
            <p className="text-sm text-red-800">
              This will permanently delete your account. Type <strong>DELETE</strong> to confirm.
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="max-w-xs"
            />
            <div className="flex gap-3">
              <Button
                onClick={handleDeleteAccount}
                disabled={actionLoading || deleteConfirmText !== 'DELETE'}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {actionLoading ? 'Deleting...' : 'Delete My Account'}
              </Button>
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                variant="outline"
                disabled={actionLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
