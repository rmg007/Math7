import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const checkSuperAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        navigate('/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles' as never)
        .select('role')
        .eq('id', user.id)
        .single()

      if (error || !profile || (profile as { role: string }).role !== 'super_admin') {
        navigate('/')
        return
      }

      setAuthorized(true)
      setLoading(false)
    }

    checkSuperAdmin()
  }, [navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return <>{children}</>
}
