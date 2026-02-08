import { ReactNode, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { App } from '@/features/platform/hooks/use-apps';
import { AppContext } from './AppContextDefinition';
// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);

const STORAGE_KEY = 'questerix_admin_current_app_id';

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentApp, setCurrentApp] = useState<App | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadApps() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('apps')
        .select('*')
        .order('display_name');

      if (error) throw error;

      if (data && data.length > 0) {
        setApps(data);

        // Try to restore from localStorage
        const savedAppId = localStorage.getItem(STORAGE_KEY);
        const savedApp = data.find(a => a.app_id === savedAppId);

        if (savedApp) {
          setCurrentApp(savedApp);
        } else {
          // Auto-select first active app or first app
          const activeApp = data.find(a => a.is_active) || data[0];
          setCurrentApp(activeApp);
        }
      }
    } catch (err) {
      console.error('Failed to load apps:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadApps();
  }, []);

  const handleSetCurrentApp = (app: App) => {
    setCurrentApp(app);
    localStorage.setItem(STORAGE_KEY, app.app_id);
  };

  return (
    <AppContext.Provider value={{
      currentApp,
      setCurrentApp: handleSetCurrentApp,
      apps,
      isLoading,
      refreshApps: loadApps
    }}>
      {children}
    </AppContext.Provider>
  );
}

// Re-export useApp hook for compatibility
// eslint-disable-next-line react-refresh/only-export-components
export { useApp } from '@/hooks/use-app';
