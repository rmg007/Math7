import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const checkUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login')
        return
      }

      // Check admin role
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      const profile = data as { role: string } | null

      if (error || profile?.role !== 'admin') {
        console.error('Access denied: Not an admin', error)
        await supabase.auth.signOut()
        navigate('/login')
        return
      }

      setLoading(false)
    } catch (e) {
      console.error(e)
      navigate('/login')
    }
  }, [navigate])

  useEffect(() => {
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login')
      } else if (event === 'SIGNED_IN') {
        await checkUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [checkUser, navigate])

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return <>{children}</>
}
