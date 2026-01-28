import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Book, Layers, FileText, Upload, LogOut, Settings, Key } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

const baseNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Domains', href: '/domains', icon: Book },
  { name: 'Skills', href: '/skills', icon: Layers },
  { name: 'Questions', href: '/questions', icon: FileText },
  { name: 'Publish', href: '/publish', icon: Upload },
]

const superAdminNavigation = [
  { name: 'Invitation Codes', href: '/invitation-codes', icon: Key },
]

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface UserInfo {
  email: string
  fullName: string | null
  role: string
}

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Sidebar: Current user:', user?.email)
      
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles' as never)
          .select('role, full_name, email')
          .eq('id', user.id)
          .single()
        
        console.log('Sidebar: Profile data:', profile, 'Error:', error)
        
        if (profile) {
          const profileData = profile as { role: string; full_name: string | null; email: string }
          setUserInfo({
            email: profileData.email || user.email || '',
            fullName: profileData.full_name,
            role: profileData.role
          })
          
          if (profileData.role === 'super_admin') {
            console.log('Sidebar: User is super_admin, showing invitation codes')
            setIsSuperAdmin(true)
          }
        }
      }
    }
    checkRole()
  }, [])

  const navigation = [
    ...baseNavigation,
    ...(isSuperAdmin ? superAdminNavigation : []),
    ...bottomNavigation,
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="flex w-72 flex-col bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 h-screen">
      <div className="flex h-20 items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Math7</h1>
            <p className="text-xs text-purple-300">Admin Panel</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-white/15 text-white shadow-lg" 
                  : "text-purple-200 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-purple-300" : "")} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        {userInfo && (
          <div className="mb-4 px-4 py-3 bg-white/5 rounded-xl">
            <p className="text-sm font-medium text-white truncate">
              {userInfo.fullName || userInfo.email.split('@')[0]}
            </p>
            <span className={cn(
              "inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full",
              userInfo.role === 'super_admin' 
                ? "bg-purple-500/30 text-purple-200" 
                : "bg-blue-500/30 text-blue-200"
            )}>
              {userInfo.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
            <p className="text-xs text-purple-300 truncate mt-1">{userInfo.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium text-purple-200 hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
