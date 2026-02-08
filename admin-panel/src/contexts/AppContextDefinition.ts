import { createContext } from 'react';
import { App } from '@/features/platform/hooks/use-apps';

export interface AppContextType {
  apps: App[];
  currentApp: App | null;
  isLoading: boolean;
  setCurrentApp: (app: App) => void;
  refreshApps: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
