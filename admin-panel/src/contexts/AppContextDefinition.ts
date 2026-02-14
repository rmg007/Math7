import { App } from '@/features/platform/hooks/use-apps';
import { createContext } from 'react';

export interface AppContextType {
  apps: App[];
  currentApp: App | null;
  isLoading: boolean;
  setCurrentApp: (app: App) => void;
  refreshApps: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  userRole: string | null;
  isSuperAdmin: boolean;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
