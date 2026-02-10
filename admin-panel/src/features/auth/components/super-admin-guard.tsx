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
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error || !profile || profile.role !== 'super_admin') {
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
      <div className="flex flex-col items-center justify-center p-20 animate-in fade-in duration-700">
        <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center animate-bounce">
          <div className="h-6 w-6 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
        </div>
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Elevating Authority</p>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return <>{children}</>
}
