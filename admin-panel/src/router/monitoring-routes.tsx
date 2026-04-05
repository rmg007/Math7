import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { withSuspense, withErrorBoundary, withSuperAdmin } from './route-wrappers';
import { RouteErrorFallback } from './route-error-fallback';

const KnownIssuesPage = lazy(() =>
  import('@/features/monitoring/pages/KnownIssuesPage').then((m) => ({
    default: m.KnownIssuesPage,
  }))
);
const ErrorLogsPage = lazy(() =>
  import('@/features/monitoring/pages/ErrorLogsPage').then((m) => ({ default: m.ErrorLogsPage }))
);

export const monitoringRoutes: RouteObject[] = [
  {
    path: '/known-issues',
    element: withSuperAdmin(withSuspense(KnownIssuesPage)),
  },
  {
    path: '/error-logs',
    element: withErrorBoundary(
      withSuperAdmin(withSuspense(ErrorLogsPage)),
      <RouteErrorFallback
        title="Error Logs Unavailable"
        message="The error logs page encountered an issue. This may be due to missing database tables or permissions."
        icon={
          <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        }
      />
    ),
  },
];
