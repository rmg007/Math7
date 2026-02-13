import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApp } from '@/contexts/AppContext'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import {
    AlertTriangle,
    BarChart3,
    Book,
    Boxes,
    Bug,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    FileText,
    FileUp,
    Globe,
    History,
    Key,
    Layers,
    Layout,
    LifeBuoy,
    LogOut,
    MessageSquare,
    Settings,
    Shield,
    Upload,
    UserCog,
    Users
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
  isExternal?: boolean
}

type NavGroup = {
  title: string
  items: NavItem[]
}

const navigationGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: BarChart3, superAdminOnly: true },
    ]
  },
  {
    title: 'Curriculum',
    items: [
      { name: 'My Groups', href: '/groups', icon: Users, hideForSuperAdmin: true }, // Hide from super admins
      { name: 'Domains', href: '/domains', icon: Book },
      { name: 'Subjects', href: '/subjects', icon: Boxes, superAdminOnly: true },
      { name: 'Skills', href: '/skills', icon: Layers },
      { name: 'Questions', href: '/questions', icon: FileText },
      { name: 'Bulk Import', href: '/ai-import', icon: FileUp },
    ]
  },
  {
    title: 'Deployment',
    items: [
      { name: 'Publish', href: '/publish', icon: Upload },
      { name: 'Version History', href: '/versions', icon: History },
      { name: 'Apps', href: '/apps', icon: Layout, superAdminOnly: true },
      { name: 'Landing Pages', href: '/landings', icon: Globe, superAdminOnly: true },
    ]
  },
  {
    title: 'System Health',
    items: [
      { name: 'Error Logs', href: '/error-logs', icon: AlertTriangle },
      { name: 'Known Issues', href: '/known-issues', icon: Bug },
      { name: 'AI Governance', href: '/governance', icon: Shield, superAdminOnly: true },
      { name: 'AI Sessions', href: '/ai-sessions', icon: History },
    ]
  },
  {
    title: 'Admin',
    items: [
      { name: 'User Management', href: '/users', icon: UserCog, superAdminOnly: true },
      { name: 'Invitation Codes', href: '/invitation-codes', icon: Key, superAdminOnly: true },
      { name: 'Settings', href: '/settings', icon: Settings },
    ]
  },
  {
    title: 'Support',
    items: [
      { name: 'Feedback', href: 'https://github.com/rmg007/Questerix/issues', icon: MessageSquare, isExternal: true },
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
          .from('profiles')
          .select('role, full_name, email')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUserInfo({
            email: profile.email || user.email || '',
            fullName: profile.full_name,
            role: profile.role
          })
          
          setIsSuperAdmin(profile.role === 'super_admin')
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
        "flex h-16 items-center border-b border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden",
        isSidebarCollapsed ? "px-0 justify-center" : "px-5 justify-between"
      )}>
        <div className={cn(
          "flex items-center gap-3 overflow-hidden",
          isSidebarCollapsed && "justify-center w-full"
        )}>
          <button
            onClick={isSidebarCollapsed ? toggleSidebar : undefined}
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/20 flex-shrink-0",
              isSidebarCollapsed && "cursor-pointer hover:shadow-purple-500/40 transition-shadow"
            )}
            title={isSidebarCollapsed ? "Expand sidebar (Ctrl+B)" : undefined}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
          {!isSidebarCollapsed && (
            <h1 className="text-lg font-bold text-white tracking-tight leading-none animate-in fade-in duration-300">Questerix</h1>
          )}
        </div>
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-0.5">
            <a
              href="mailto:support@questerix.com?subject=Admin%20Panel%20Feedback"
              className="p-1.5 rounded-lg text-purple-300/40 hover:text-white hover:bg-white/10 transition-colors"
              title="Help & Feedback"
            >
              <LifeBuoy className="h-4 w-4" />
            </a>
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-purple-300/40 hover:text-white hover:bg-white/10 transition-colors"
              title="Collapse sidebar (Ctrl+B)"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* App Selector */}
      <div className={cn(
        "py-3 border-b border-white/5",
        isSidebarCollapsed ? "px-0 flex justify-center" : "px-3"
      )}>
        {!isSidebarCollapsed ? (
          <Select
            value={currentApp?.app_id}
            onValueChange={(value) => {
              const app = apps.find(a => a.app_id === value)
              if (app) setCurrentApp(app)
            }}
          >
            <SelectTrigger aria-label="Select application" className="w-full bg-transparent border-white/10 text-white hover:bg-white/5 transition-colors rounded-lg focus:ring-0">
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
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto sidebar">
        {navigationGroups.map((group) => {
          // Filter items based on role
          const visibleItems = group.items.filter(item => {
            if (item.superAdminOnly && !isSuperAdmin) return false;
            if (item.hideForSuperAdmin && isSuperAdmin) return false;
            return true;
          });
          const matchGroupPath = visibleItems.some(item => location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href)));
          const isOpen = openGroups.includes(group.title);

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-0.5">
                {!isSidebarCollapsed && (
                  <button 
                    onClick={() => toggleGroup(group.title)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors group mb-0.5",
                      matchGroupPath 
                        ? "text-purple-200/80" 
                        : "text-purple-400/40 hover:text-purple-300/70"
                    )}
                  >
                    <span>{group.title}</span>
                    <div className="flex items-center gap-1">
                      {matchGroupPath && !isOpen && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />}
                      {isOpen ? (
                        <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <ChevronRight className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </button>
                )}
              
              {isOpen && (
                <div className="space-y-1 mt-1">
                  {visibleItems.map((item) => {
                    const isActive = location.pathname === item.href || 
                      (item.href !== '/' && location.pathname.startsWith(item.href))
                    if (item.isExternal) {
                      return (
                        <a
                          key={item.name}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={isSidebarCollapsed ? item.name : undefined}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                            !isSidebarCollapsed && "ml-1",
                            isActive 
                              ? "bg-purple-500/15 text-white font-semibold" 
                              : "text-purple-200/80 hover:bg-white/5 hover:text-white",
                            isSidebarCollapsed && "justify-center px-0 w-10 mx-auto ml-0"
                          )}
                        >
                          <item.icon className={cn(
                            "h-[18px] w-[18px] transition-colors",
                            isActive ? "text-white" : "text-purple-400/70 group-hover:text-purple-200"
                          )} />
                          {!isSidebarCollapsed && (
                            <span className="flex-1 text-sm">{item.name}</span>
                          )}
                          {isActive && !isSidebarCollapsed && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-purple-400 to-blue-400 rounded-r-full shadow-[0_0_10px_rgba(192,132,252,0.6)]" />
                          )}
                        </a>
                      )
                    }

                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={handleNavClick}
                        title={isSidebarCollapsed ? item.name : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                          !isSidebarCollapsed && "ml-1",
                          isActive 
                            ? "bg-purple-500/15 text-white font-semibold" 
                            : "text-purple-200/80 hover:bg-white/5 hover:text-white",
                          isSidebarCollapsed && "justify-center px-0 w-10 mx-auto ml-0"
                        )}
                      >
                        <item.icon className={cn(
                          "h-[18px] w-[18px] transition-colors",
                          isActive ? "text-white" : "text-purple-400/70 group-hover:text-purple-200"
                        )} />
                        {!isSidebarCollapsed && (
                          <span className="flex-1 text-sm">{item.name}</span>
                        )}
                        {isActive && !isSidebarCollapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-purple-400 to-blue-400 rounded-r-full shadow-[0_0_10px_rgba(192,132,252,0.6)]" />
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
      <div className="px-3 py-3 border-t border-white/10 bg-black/20 backdrop-blur-md space-y-2">
        {userInfo && (
          <div className={cn(
            "bg-white/5 rounded-lg border border-white/5 transition-all duration-300",
            isSidebarCollapsed ? "p-2 flex flex-col items-center gap-2" : "flex items-center gap-2.5 px-3 py-2.5"
          )}>
            {!isSidebarCollapsed ? (
              <>
                <div 
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center text-purple-200 text-xs font-bold flex-shrink-0"
                  title={userInfo.email}
                >
                  {(userInfo.fullName || userInfo.email).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate leading-tight">
                    {userInfo.fullName || userInfo.email.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-purple-300/50 truncate leading-tight">
                    {userInfo.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  id="logout-button-desktop"
                  className="p-1.5 text-purple-400/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-purple-200 text-xs font-bold"
                  title={`${userInfo.fullName || userInfo.email}`}
                >
                  {(userInfo.fullName || userInfo.email).charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  id="logout-button-mobile"
                  className="p-1.5 text-purple-300 hover:text-white transition-colors hover:bg-white/10 rounded-lg"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
        {!userInfo && (
            <button
            onClick={handleLogout}
            id="logout-button"
            className="flex items-center justify-center gap-2 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-200"
            >
            <LogOut className="h-4 w-4" />
            Sign Out
            </button>
        )}
      </div>
    </div>
  )
}
