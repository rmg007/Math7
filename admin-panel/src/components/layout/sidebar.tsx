import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Book, Layers, FileText, Upload, LogOut, Settings, Key, History, Users, UserCog, Shield, Bug, AlertTriangle, Globe, Boxes, Layout } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  isMobile?: boolean
}

const baseNavigation = [
  // Dashboard removed as per requirement
  { name: 'My Groups', href: '/groups', icon: Users },
  { name: 'Domains', href: '/domains', icon: Book },
  { name: 'Skills', href: '/skills', icon: Layers },
  { name: 'Questions', href: '/questions', icon: FileText },
  { name: 'Publish', href: '/publish', icon: Upload },
  { name: 'Version History', href: '/versions', icon: History },
  { name: 'Error Logs', href: '/error-logs', icon: AlertTriangle },
  { name: 'Known Issues', href: '/known-issues', icon: Bug },
]

const superAdminNavigation = [
  { name: 'Invitation Codes', href: '/invitation-codes', icon: Key },
  { name: 'User Management', href: '/users', icon: UserCog },
  { name: 'AI Governance', href: '/governance', icon: Shield },
]

const platformNavigation = [
  { name: 'Subjects', href: '/platform/subjects', icon: Boxes },
  { name: 'Apps', href: '/platform/apps', icon: Layout },
  { name: 'Landing Pages', href: '/platform/landings', icon: Globe },
]

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface UserInfo {
  email: string
  fullName: string | null
  role: string
}

export function Sidebar({ isOpen = true, onClose, isMobile = false }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentApp, setCurrentApp, apps, isLoading: appsLoading } = useApp()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose()
    }
  }

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
          } else {
            console.log('Sidebar: User is NOT super_admin, resetting state')
            setIsSuperAdmin(false)
          }
        }
      } else {
        // No user, reset state
        setUserInfo(null)
        setIsSuperAdmin(false)
      }
    }

    // Initial check
    checkRole()

    // Subscribe to auth changes to handle session switching (Role Flickering Fix)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Sidebar: Auth state change:', event, session?.user?.email)
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkRole()
      } else if (event === 'SIGNED_OUT') {
        setUserInfo(null)
        setIsSuperAdmin(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const navigation = [
    ...baseNavigation.filter(item => !(isSuperAdmin && item.name === 'My Groups')),
    ...(isSuperAdmin ? platformNavigation : []),
    ...(isSuperAdmin ? superAdminNavigation : []),
    ...bottomNavigation,
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div 
      className={cn(
        "flex w-72 flex-col h-screen border-r border-white/5",
        "bg-gradient-to-b from-[#1a1b4b] via-[#2e1065] to-[#1a1b4b]",
        isMobile && "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl",
        isMobile && !isOpen && "-translate-x-full",
        isMobile && isOpen && "translate-x-0"
      )}
    >
      {/* Header */}
      <div className="flex h-20 items-center px-6 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none mb-1">Questerix</h1>
            <p className="text-[10px] text-purple-300 font-medium uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
      </div>
      
      {/* App Selector */}
      <div className="px-4 py-4 border-b border-white/5 bg-white/5 backdrop-blur-sm">
        <label className="text-[10px] font-semibold text-purple-300/60 uppercase tracking-wider mb-2 block px-2">
          Current Application
        </label>
        <Select
          value={currentApp?.app_id}
          onValueChange={(value) => {
            const app = apps.find(a => a.app_id === value)
            if (app) setCurrentApp(app)
          }}
        >
          <SelectTrigger className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors rounded-xl focus:ring-0">
            <SelectValue placeholder={appsLoading ? "Loading apps..." : "Select app"} />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1b4b] border-white/10 text-white">
            {apps.map((app) => (
              <SelectItem 
                key={app.app_id} 
                value={app.app_id}
                className="focus:bg-purple-500/20 focus:text-white"
              >
                {app.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Navigation - Scrollable Area */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group relative",
                isActive 
                  ? "bg-white/10 text-white shadow-inner border border-white/5" 
                  : "text-purple-200 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-purple-300" : "text-purple-400 group-hover:text-purple-200")} />
              {item.name}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-400 rounded-r-full shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Footer - Pinned to Bottom */}
      <div className="px-4 py-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
        {userInfo && (
          <div className="mb-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center justify-between mb-2">
                 <p className="text-sm font-semibold text-white truncate">
                  {userInfo.fullName || userInfo.email.split('@')[0]}
                </p>
                <button
                    onClick={handleLogout}
                     className="text-purple-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
                     title="Sign Out"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
            
            <div className="flex items-center justify-between">
                <span className={cn(
                  "inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full uppercase tracking-wider",
                  userInfo.role === 'super_admin' 
                    ? "bg-purple-500/20 text-purple-200 border border-purple-500/30" 
                    : "bg-blue-500/20 text-blue-200 border border-blue-500/30"
                )}>
                  {userInfo.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </span>
                <p className="text-[10px] text-purple-300/60 truncate max-w-[100px]">{userInfo.email}</p>
            </div>
          </div>
        )}
        {!userInfo && (
            <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-200"
            >
            <LogOut className="h-4 w-4" />
            Sign Out
            </button>
        )}
      </div>
    </div>
  )
}
