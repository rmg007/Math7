import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Book, Layers, FileText, Upload, LogOut, Settings, Key, History, 
  Users, UserCog, Shield, Bug, AlertTriangle, Globe, Boxes, Layout,
  ChevronDown, ChevronRight, ChevronLeft
} from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
// Separator removed as it was unused

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  isMobile?: boolean
}

type NavItem = {
  name: string
  href: string
  icon: React.ElementType
  superAdminOnly?: boolean
  hideForSuperAdmin?: boolean
}

type NavGroup = {
  title: string
  items: NavItem[]
}

const navigationGroups: NavGroup[] = [
  {
    title: 'Curriculum',
    items: [
      { name: 'My Groups', href: '/groups', icon: Users, hideForSuperAdmin: true }, // Hide from super admins
      { name: 'Domains', href: '/domains', icon: Book },
      { name: 'Subjects', href: '/platform/subjects', icon: Boxes, superAdminOnly: true },
      { name: 'Skills', href: '/skills', icon: Layers },
      { name: 'Questions', href: '/questions', icon: FileText },
    ]
  },
  {
    title: 'Deployment',
    items: [
      { name: 'Publish', href: '/publish', icon: Upload },
      { name: 'Version History', href: '/versions', icon: History },
      { name: 'Apps', href: '/platform/apps', icon: Layout, superAdminOnly: true },
      { name: 'Landing Pages', href: '/platform/landings', icon: Globe, superAdminOnly: true },
    ]
  },
  {
    title: 'System Health',
    items: [
      { name: 'Error Logs', href: '/error-logs', icon: AlertTriangle },
      { name: 'Known Issues', href: '/known-issues', icon: Bug },
      { name: 'AI Governance', href: '/governance', icon: Shield, superAdminOnly: true },
    ]
  },
  {
    title: 'Admin',
    items: [
      { name: 'User Management', href: '/users', icon: UserCog, superAdminOnly: true },
      { name: 'Invitation Codes', href: '/invitation-codes', icon: Key, superAdminOnly: true },
      { name: 'Settings', href: '/settings', icon: Settings },
    ]
  }
]

interface UserInfo {
  email: string
  fullName: string | null
  role: string
}

export function Sidebar({ isOpen = true, onClose, isMobile = false }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentApp, setCurrentApp, apps, isLoading: appsLoading, isSidebarCollapsed, toggleSidebar } = useApp()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  
  // State for collapsible groups - default all open
  const [openGroups, setOpenGroups] = useState<string[]>(navigationGroups.map(g => g.title))

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    )
  }

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose()
    }
  }

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles' as never)
          .select('role, full_name, email')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          const profileData = profile as { role: string; full_name: string | null; email: string }
          setUserInfo({
            email: profileData.email || user.email || '',
            fullName: profileData.full_name,
            role: profileData.role
          })
          
          setIsSuperAdmin(profileData.role === 'super_admin')
        }
      } else {
        setUserInfo(null)
        setIsSuperAdmin(false)
      }
    }

    checkRole()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div 
      className={cn(
        "flex flex-col h-screen border-r border-white/5",
        "bg-gradient-to-b from-[#1a1b4b] via-[#2e1065] to-[#1a1b4b]",
        isMobile && "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl",
        isMobile && !isOpen && "-translate-x-full",
        isMobile && isOpen && "translate-x-0",
        isMobile ? "w-72" : isSidebarCollapsed ? "w-20" : "w-72",
        "transition-all duration-300 ease-in-out"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex h-20 items-center border-b border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden",
        isSidebarCollapsed ? "px-0 justify-center" : "px-6"
      )}>
        <div className={cn(
          "flex items-center gap-3",
          isSidebarCollapsed ? "flex-col justify-center" : "flex-1"
        )}>
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/20 flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          {!isSidebarCollapsed && (
            <div className="animate-in fade-in duration-300">
              <h1 className="text-lg font-bold text-white tracking-tight leading-none mb-1">Questerix</h1>
              <p className="text-[10px] text-purple-300 font-medium uppercase tracking-widest">Admin Panel</p>
            </div>
          )}
        </div>
      </div>
      
      {/* App Selector */}
      <div className={cn(
        "py-4 border-b border-white/5 bg-white/5 backdrop-blur-sm",
        isSidebarCollapsed ? "px-0 flex justify-center" : "px-4"
      )}>
        {!isSidebarCollapsed ? (
          <>
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
          </>
        ) : (
          <div 
            className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-purple-200 font-bold text-sm cursor-help hover:bg-white/10 transition-colors"
            title={`Application: ${currentApp?.display_name || 'None'}`}
          >
            {currentApp?.display_name?.charAt(0).toUpperCase() || '?'}
          </div>
        )}
      </div>
      
      {/* Navigation - Scrollable Area */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar">
        {navigationGroups.map((group) => {
          // Filter items based on role
          const visibleItems = group.items.filter(item => {
            if (item.superAdminOnly && !isSuperAdmin) return false;
            if (item.hideForSuperAdmin && isSuperAdmin) return false;
            return true;
          });
          const matchGroupPath = visibleItems.some(item => location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href)));
          const isOpen = openGroups.includes(group.title);

          return (
            <div key={group.title} className="space-y-1 pt-2 border-t border-white/5 first:pt-0 first:border-0">
                {!isSidebarCollapsed && (
                  <button 
                    onClick={() => toggleGroup(group.title)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-lg group mb-1",
                      matchGroupPath 
                        ? "text-white bg-white/10" 
                        : "text-purple-300/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span>{group.title}</span>
                    <div className="flex items-center gap-1">
                      {matchGroupPath && !isOpen && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />}
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-transform" />
                      ) : (
                        <ChevronRight className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-transform" />
                      )}
                    </div>
                  </button>
                )}
              
              {isOpen && (
                <div className="space-y-1 mt-1">
                  {visibleItems.map((item) => {
                    const isActive = location.pathname === item.href || 
                      (item.href !== '/' && location.pathname.startsWith(item.href))
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={handleNavClick}
                        title={isSidebarCollapsed ? item.name : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 group relative",
                          isActive 
                            ? "bg-white/10 text-white shadow-inner border border-white/5" 
                            : "text-purple-200 hover:bg-white/5 hover:text-white",
                          isSidebarCollapsed && "justify-center px-0 w-10 mx-auto"
                        )}
                      >
                        <item.icon className={cn(
                          "h-4 w-4 transition-colors",
                          isActive ? "text-purple-300" : "text-purple-400 group-hover:text-purple-200"
                        )} />
                        {!isSidebarCollapsed && (
                          <span className="flex-1 text-sm font-medium">{item.name}</span>
                        )}
                        {isActive && !isSidebarCollapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-400 rounded-r-full shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User Footer - Pinned to Bottom */}
      <div className="px-4 py-4 border-t border-white/10 bg-black/20 backdrop-blur-md space-y-3">
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex items-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all duration-300 group overflow-hidden",
            isSidebarCollapsed ? "w-10 h-10 justify-center mx-auto" : "w-full px-4 py-3 justify-between"
          )}
          title={isSidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
        >
          {!isSidebarCollapsed && <span className="text-sm font-medium truncate">Sidebar</span>}
          <div className={cn("flex items-center", isSidebarCollapsed ? "" : "gap-2")}>
            {!isSidebarCollapsed && (
              <span className="text-[10px] text-purple-300/60 uppercase tracking-wider animate-in fade-in slide-in-from-right-2">
                Collapse
              </span>
            )}
            <ChevronLeft className={cn(
              "h-4 w-4 transition-transform duration-300",
              isSidebarCollapsed ? "rotate-180" : "rotate-0"
            )} />
          </div>
        </button>

        {userInfo && (
          <div className={cn(
            "bg-white/5 rounded-xl border border-white/5 transition-all duration-300",
            isSidebarCollapsed ? "p-1.5 flex flex-col items-center gap-2" : "px-4 py-3"
          )}>
            {!isSidebarCollapsed ? (
              <>
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
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-purple-200 text-xs font-bold"
                  title={`${userInfo.fullName || userInfo.email}`}
                >
                  {(userInfo.fullName || userInfo.email).charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-purple-300 hover:text-white transition-colors hover:bg-white/10 rounded-lg"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
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
