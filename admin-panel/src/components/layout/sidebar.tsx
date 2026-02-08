import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Book, Layers, FileText, Upload, LogOut, Settings, Key, History,
  Users, UserCog, Shield, Bug, AlertTriangle, Globe, Boxes, Layout,
  Wand2, ChevronDown, PanelLeftClose,
  PanelLeft, type LucideIcon
} from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useState, useEffect, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

interface NavGroup {
  id: string
  label: string
  items: NavItem[]
  /** If true, only shown when user is super_admin */
  superAdminOnly?: boolean
  /** If true, only shown when user is NOT super_admin */
  adminOnly?: boolean
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  isMobile?: boolean
}

interface UserInfo {
  email: string
  fullName: string | null
  role: string
}

// ---------------------------------------------------------------------------
// Navigation config – grouped & ordered by workflow priority
// ---------------------------------------------------------------------------

const SIDEBAR_COLLAPSED_KEY = 'questerix-sidebar-collapsed'
const GROUP_STATE_KEY = 'questerix-sidebar-groups'

const curriculumGroup: NavGroup = {
  id: 'curriculum',
  label: 'Curriculum',
  items: [
    { name: 'Domains', href: '/domains', icon: Book },
    { name: 'Skills', href: '/skills', icon: Layers },
    { name: 'Questions', href: '/questions', icon: FileText },
    { name: 'AI Generator', href: '/ai-questions', icon: Wand2 },
    { name: 'Publish', href: '/publish', icon: Upload },
    { name: 'Version History', href: '/versions', icon: History },
  ],
}

const groupsGroup: NavGroup = {
  id: 'groups',
  label: 'Groups',
  adminOnly: true,
  items: [
    { name: 'My Groups', href: '/groups', icon: Users },
  ],
}

const monitoringGroup: NavGroup = {
  id: 'monitoring',
  label: 'Monitoring',
  items: [
    { name: 'Error Logs', href: '/error-logs', icon: AlertTriangle },
    { name: 'Known Issues', href: '/known-issues', icon: Bug },
  ],
}

const platformGroup: NavGroup = {
  id: 'platform',
  label: 'Platform',
  superAdminOnly: true,
  items: [
    { name: 'Subjects', href: '/platform/subjects', icon: Boxes },
    { name: 'Apps', href: '/platform/apps', icon: Layout },
    { name: 'Landing Pages', href: '/platform/landings', icon: Globe },
  ],
}

const administrationGroup: NavGroup = {
  id: 'administration',
  label: 'Administration',
  superAdminOnly: true,
  items: [
    { name: 'User Management', href: '/users', icon: UserCog },
    { name: 'Invitation Codes', href: '/invitation-codes', icon: Key },
    { name: 'AI Governance', href: '/governance', icon: Shield },
  ],
}

const allGroups: NavGroup[] = [
  curriculumGroup,
  groupsGroup,
  monitoringGroup,
  platformGroup,
  administrationGroup,
]

const bottomNavigation: NavItem[] = [
  { name: 'Settings', href: '/settings', icon: Settings },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadGroupState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(GROUP_STATE_KEY)
    if (raw) return JSON.parse(raw) as Record<string, boolean>
  } catch {
    // ignore
  }
  // Default: all groups expanded
  return {}
}

function saveGroupState(state: Record<string, boolean>) {
  try {
    localStorage.setItem(GROUP_STATE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Collapsible NavSection component
// ---------------------------------------------------------------------------

function NavSection({
  group,
  sidebarCollapsed,
  isExpanded,
  onToggle,
  pathname,
  onNavClick,
}: {
  group: NavGroup
  sidebarCollapsed: boolean
  isExpanded: boolean
  onToggle: () => void
  pathname: string
  onNavClick: () => void
}) {
  // Count active items in this group (for collapsed badge)
  const hasActiveItem = group.items.some(
    (item) => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
  )

  return (
    <div className="mb-0.5">
      {/* ---- Section header (clickable to toggle) ---- */}
      {!sidebarCollapsed ? (
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center justify-between px-4 pt-3 pb-1.5 group/header cursor-pointer',
            'hover:bg-white/[0.03] rounded-lg mx-1 transition-colors'
          )}
        >
          <span className={cn(
            'text-[10px] font-semibold uppercase tracking-widest select-none transition-colors',
            hasActiveItem ? 'text-purple-300/70' : 'text-purple-300/40 group-hover/header:text-purple-300/60'
          )}>
            {group.label}
          </span>
          <ChevronDown
            className={cn(
              'h-3 w-3 text-purple-300/30 transition-transform duration-200 group-hover/header:text-purple-300/50',
              !isExpanded && '-rotate-90'
            )}
          />
        </button>
      ) : (
        /* Sidebar collapsed: thin divider instead of label */
        <div className="mx-3 my-2 border-t border-white/5" />
      )}

      {/* ---- Items (animated collapse) ---- */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          !sidebarCollapsed && !isExpanded && 'max-h-0 opacity-0',
          !sidebarCollapsed && isExpanded && 'max-h-[500px] opacity-100',
          sidebarCollapsed && 'max-h-[500px] opacity-100'  // always show in sidebar-collapsed mode
        )}
      >
        {group.items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onNavClick}
              title={sidebarCollapsed ? item.name : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                sidebarCollapsed ? 'mx-2 px-0 py-3 justify-center' : 'mx-2 px-4 py-2.5',
                isActive
                  ? 'bg-white/10 text-white shadow-inner border border-white/5'
                  : 'text-purple-200 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive
                    ? 'text-purple-300'
                    : 'text-purple-400 group-hover:text-purple-200'
                )}
              />
              {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-400 rounded-r-full shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sidebar component
// ---------------------------------------------------------------------------

export function Sidebar({ isOpen = true, onClose, isMobile = false }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentApp, setCurrentApp, apps, isLoading: appsLoading } = useApp()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  // ---- Sidebar collapse state (icon-only mode) ----------------------------
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (isMobile) return false
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
    } catch {
      return false
    }
  })

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  // ---- Per-group expand/collapse state (accordion) -------------------------
  const [groupState, setGroupState] = useState<Record<string, boolean>>(loadGroupState)

  const isGroupExpanded = (groupId: string) => groupState[groupId] !== false // default expanded

  const toggleGroup = useCallback((groupId: string) => {
    setGroupState((prev) => {
      const next = { ...prev, [groupId]: prev[groupId] === false }
      saveGroupState(next)
      return next
    })
  }, [])

  const handleNavClick = () => {
    if (isMobile && onClose) onClose()
  }

  // ---- Auth / role check ---------------------------------------------------
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
            role: profileData.role,
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

    return () => { subscription.unsubscribe() }
  }, [])

  // ---- Filter groups by role -----------------------------------------------
  const visibleGroups = allGroups.filter((g) => {
    if (g.superAdminOnly && !isSuperAdmin) return false
    if (g.adminOnly && isSuperAdmin) return false
    return true
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // ---- Effective collapsed state (never collapse on mobile) ----------------
  const effectiveCollapsed = !isMobile && isCollapsed

  return (
    <div
      className={cn(
        'flex flex-col h-screen border-r border-white/5 transition-all duration-300',
        'bg-gradient-to-b from-[#1a1b4b] via-[#2e1065] to-[#1a1b4b]',
        effectiveCollapsed ? 'w-20' : 'w-72',
        isMobile && 'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl w-72',
        isMobile && !isOpen && '-translate-x-full',
        isMobile && isOpen && 'translate-x-0'
      )}
    >
      {/* ============ Header ============ */}
      <div className="flex h-16 items-center px-4 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className={cn('flex items-center flex-1', effectiveCollapsed ? 'justify-center' : 'gap-3 px-2')}>
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/20 shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          {!effectiveCollapsed && (
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white tracking-tight leading-none mb-0.5">Questerix</h1>
              <p className="text-[9px] text-purple-300 font-medium uppercase tracking-widest">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Collapse toggle – desktop only */}
        {!isMobile && (
          <button
            onClick={toggleCollapsed}
            className="p-1.5 rounded-lg text-purple-300/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {effectiveCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* ============ App Selector ============ */}
      {!effectiveCollapsed && (
        <div className="px-4 py-3 border-b border-white/5 bg-white/[0.03]">
          <label className="text-[9px] font-semibold text-purple-300/50 uppercase tracking-wider mb-1.5 block px-1">
            Application
          </label>
          <Select
            value={currentApp?.app_id || ''}
            onValueChange={(value) => {
              const app = apps.find((a) => a.app_id === value)
              if (app) setCurrentApp(app)
            }}
          >
            <SelectTrigger className="w-full bg-white/5 border-white/10 text-white text-xs hover:bg-white/10 transition-colors rounded-lg focus:ring-0 h-9">
              <SelectValue placeholder={appsLoading ? 'Loading...' : 'Select app'} />
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
      )}

      {/* ============ Grouped Navigation (collapsible sections) ============ */}
      <nav className="flex-1 py-1.5 overflow-y-auto custom-scrollbar">
        {visibleGroups.map((group) => (
          <NavSection
            key={group.id}
            group={group}
            sidebarCollapsed={effectiveCollapsed}
            isExpanded={isGroupExpanded(group.id)}
            onToggle={() => toggleGroup(group.id)}
            pathname={location.pathname}
            onNavClick={handleNavClick}
          />
        ))}
      </nav>

      {/* ============ Bottom nav (Settings) ============ */}
      <div className="border-t border-white/5 px-2 py-1.5">
        {bottomNavigation.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== '/' && location.pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              title={effectiveCollapsed ? item.name : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                effectiveCollapsed ? 'px-0 py-2.5 justify-center' : 'px-4 py-2.5',
                isActive
                  ? 'bg-white/10 text-white shadow-inner border border-white/5'
                  : 'text-purple-200 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-purple-300' : 'text-purple-400 group-hover:text-purple-200'
                )}
              />
              {!effectiveCollapsed && <span>{item.name}</span>}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-400 rounded-r-full shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
              )}
            </Link>
          )
        })}
      </div>

      {/* ============ User Footer ============ */}
      <div className="px-3 py-2.5 border-t border-white/10 bg-black/20 backdrop-blur-md">
        {userInfo && (
          <div className={cn(
            'bg-white/5 rounded-xl border border-white/5',
            effectiveCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'px-3 py-2.5'
          )}>
            {effectiveCollapsed ? (
              /* Collapsed: just avatar circle + logout */
              <>
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-[11px] font-bold text-white uppercase"
                  title={userInfo.fullName || userInfo.email}
                >
                  {(userInfo.fullName || userInfo.email)[0]}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-purple-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              /* Expanded: full user info */
              <>
                <div className="flex items-center justify-between mb-1.5">
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
                    'inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full uppercase tracking-wider',
                    userInfo.role === 'super_admin'
                      ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                      : 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
                  )}>
                    {userInfo.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                  <p className="text-[10px] text-purple-300/60 truncate max-w-[100px]">{userInfo.email}</p>
                </div>
              </>
            )}
          </div>
        )}
        {!userInfo && (
          <button
            onClick={handleLogout}
            title={effectiveCollapsed ? 'Sign Out' : undefined}
            className={cn(
              'flex items-center justify-center gap-2 w-full rounded-xl text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-200',
              effectiveCollapsed ? 'px-2 py-2.5' : 'px-4 py-2.5'
            )}
          >
            <LogOut className="h-4 w-4" />
            {!effectiveCollapsed && 'Sign Out'}
          </button>
        )}
      </div>
    </div>
  )
}
