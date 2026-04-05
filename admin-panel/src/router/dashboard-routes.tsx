import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { withSuspense, withErrorBoundary, withSuperAdmin } from './route-wrappers';
import { RouteErrorFallback } from './route-error-fallback';

const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);

export const dashboardRoutes: RouteObject[] = [
  {
    path: '/dashboard',
    element: withErrorBoundary(
      withSuperAdmin(withSuspense(DashboardPage)),
      <RouteErrorFallback
        title="Dashboard Error"
        message="Failed to load standard reporting metrics. Check your network or permissions."
        borderColor="border-indigo-100"
        buttonColor="bg-indigo-600 hover:bg-indigo-700"
      />
    ),
  },
];
