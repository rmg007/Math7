import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { withSuspense, withSuperAdmin } from './route-wrappers';

const GovernancePage = lazy(() =>
  import('@/features/ai-assistant/pages/GovernancePage').then((m) => ({
    default: m.GovernancePage,
  }))
);
const GenerationPage = lazy(() =>
  import('@/features/ai-assistant/pages/GenerationPage').then((m) => ({
    default: m.GenerationPage,
  }))
);
const SessionsPage = lazy(() =>
  import('@/features/ai-assistant/pages/SessionsPage').then((m) => ({ default: m.SessionsPage }))
);
const BulkImportPage = lazy(() => import('@/features/ai-content/pages/BulkImportPage'));

export const aiRoutes: RouteObject[] = [
  {
    path: '/governance',
    element: withSuperAdmin(withSuspense(GovernancePage)),
  },
  {
    path: '/ai-questions',
    element: withSuspense(GenerationPage),
  },
  {
    path: '/ai-sessions',
    element: withSuspense(SessionsPage),
  },
  {
    path: '/ai-import',
    element: withSuspense(BulkImportPage),
  },
];
