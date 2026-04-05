import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { withSuspense, withErrorBoundary, withSuperAdmin } from './route-wrappers';
import { RouteErrorFallback } from './route-error-fallback';

const SubjectsPage = lazy(() =>
  import('@/features/platform/pages/SubjectsPage').then((m) => ({ default: m.SubjectsPage }))
);
const AppsPage = lazy(() =>
  import('@/features/platform/pages/AppsPage').then((m) => ({ default: m.AppsPage }))
);
const LandingsPage = lazy(() =>
  import('@/features/platform/pages/LandingsPage').then((m) => ({ default: m.LandingsPage }))
);

export const platformRoutes: RouteObject[] = [
  {
    path: '/subjects',
    element: withErrorBoundary(withSuperAdmin(withSuspense(SubjectsPage))),
  },
  {
    path: '/apps',
    element: withErrorBoundary(
      withSuperAdmin(withSuspense(AppsPage)),
      <RouteErrorFallback
        title="Applications Error"
        message="Critical failure in application registry. Contact infrastructure team."
        borderColor="border-purple-100"
        buttonColor="bg-purple-600 hover:bg-purple-700"
      />
    ),
  },
  {
    path: '/landings',
    element: withSuperAdmin(withSuspense(LandingsPage)),
  },
];
