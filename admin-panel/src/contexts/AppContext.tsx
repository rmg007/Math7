import { App } from '@/features/platform/hooks/use-apps';
import { supabase } from '@/lib/supabase';
import { ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from './AppContextDefinition';
// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);

const STORAGE_KEY = 'questerix_admin_current_app_id';
const SIDEBAR_COLLAPSE_KEY = 'questerix_admin_sidebar_collapsed';

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentApp, setCurrentApp] = useState<App | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  async function loadApps() {
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
            .select('app_id')
            .eq('id', user.id)
            .single();
          profileAppId = profile?.app_id ?? undefined;
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
              console.error('Failed to sync default app to profile:', err);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load apps:', err);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }

  useEffect(() => {
    let mounted = true;

    const loadAppsSafe = async () => {
      await loadApps();
      if (!mounted) return;
    };

    loadAppsSafe();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (mounted) loadAppsSafe();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSetCurrentApp = async (app: App) => {
    setCurrentApp(app);
    try {
      localStorage.setItem(STORAGE_KEY, app.app_id);
    } catch (err) {
      console.error('Failed to save app preference to localStorage:', err);
    }

    // Persist to profile for RLS context
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      try {
        await supabase.from('profiles').update({ app_id: app.app_id }).eq('id', user.id);
      } catch (err) {
        console.error('Failed to sync app preference to profile:', err);
      }
    }
  };

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSE_KEY, JSON.stringify(newState));
    } catch (err) {
      console.error('Failed to save sidebar state to localStorage:', err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentApp,
        setCurrentApp: handleSetCurrentApp,
        apps,
        isLoading,
        refreshApps: loadApps,
        isSidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Re-export useApp hook for compatibility
// eslint-disable-next-line react-refresh/only-export-components
export { useApp } from '@/hooks/use-app';
