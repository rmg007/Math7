import { App } from '@/features/platform/hooks/use-apps';
import { captureException } from '@/lib/error-tracker';
import { supabase } from '@/lib/supabase';
import { SecurityLogger } from '@/services/SecurityLogger';
import { ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppContext } from './AppContextDefinition';

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);

const STORAGE_KEY = 'questerix_admin_current_app_id';
const SIDEBAR_COLLAPSE_KEY = 'questerix_admin_sidebar_collapsed';

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentApp, setCurrentApp] = useState<App | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
    if (!saved) return false;
    try {
      return JSON.parse(saved) === true;
    } catch {
      return false;
    }
  });

  const loadApps = useCallback(async () => {
    if (isLoadingRef.current) return; // Prevent concurrent calls
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('apps').select('*').order('display_name');

      if (error) throw error;

      if (data && data.length > 0) {
        setApps(data);

        // Try to get user's persisted app preference from profile first
        const {
          data: { user },
        } = await supabase.auth.getUser();
        let profileAppId: string | undefined;

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('app_id, role')
            .eq('id', user.id)
            .maybeSingle();
          profileAppId = profile?.app_id ?? undefined;
          setUserRole(profile?.role ?? null);
        }

        const savedAppId = profileAppId || localStorage.getItem(STORAGE_KEY);
        const savedApp = data.find((a) => a.app_id === savedAppId);

        if (savedApp) {
          setCurrentApp(savedApp);
        } else {
          // Auto-select first active app or first app
          const activeApp = data.find((a) => a.is_active) || data[0];
          setCurrentApp(activeApp);
          // Sync default to profile if user exists
          if (user && activeApp) {
            try {
              await supabase
                .from('profiles')
                .update({ app_id: activeApp.app_id })
                .eq('id', user.id);
            } catch (err) {
              captureException(err as Error, {
                tags: { component: 'AppProvider', method: 'syncDefaultApp' },
              });
            }
          }
        }
      }
    } catch (err) {
      captureException(err as Error, {
        tags: { component: 'AppProvider', method: 'loadApps' },
      });
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadAppsSafe = async () => {
      await loadApps();
      if (!mounted) return;
    };

    loadAppsSafe();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Security logging
      if (event === 'SIGNED_IN' && session?.user) {
        SecurityLogger.logLogin(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        SecurityLogger.logLogout();
      }

      // Only react to meaningful auth events, not token refreshes
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        if (mounted) loadAppsSafe();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadApps]);

  const handleSetCurrentApp = useCallback(async (app: App) => {
    setCurrentApp(app);
    try {
      localStorage.setItem(STORAGE_KEY, app.app_id);
    } catch (err) {
      captureException(err as Error, {
        tags: { component: 'AppProvider', method: 'handleSetCurrentApp', action: 'localStorage' },
        extra: { storageKey: STORAGE_KEY },
      });
    }

    // Persist to profile for RLS context
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      try {
        await supabase.from('profiles').update({ app_id: app.app_id }).eq('id', user.id);
      } catch (err) {
        captureException(err as Error, {
          tags: { component: 'AppProvider', method: 'handleSetCurrentApp', action: 'profileSync' },
        });
      }
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const newState = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSE_KEY, JSON.stringify(newState));
      } catch (err) {
        captureException(err as Error, {
          tags: { component: 'AppProvider', method: 'toggleSidebar' },
          extra: { storageKey: SIDEBAR_COLLAPSE_KEY },
        });
      }
      return newState;
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      currentApp,
      setCurrentApp: handleSetCurrentApp,
      apps,
      isLoading,
      refreshApps: loadApps,
      isSidebarCollapsed,
      toggleSidebar,
      userRole,
      isSuperAdmin: userRole === 'super_admin',
    }),
    [
      currentApp,
      apps,
      isLoading,
      isSidebarCollapsed,
      handleSetCurrentApp,
      loadApps,
      toggleSidebar,
      userRole,
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

// Re-export useApp hook for compatibility
// eslint-disable-next-line react-refresh/only-export-components
export { useApp } from '@/hooks/use-app';
