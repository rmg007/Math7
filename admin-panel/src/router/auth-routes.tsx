import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { withSuspense, withErrorBoundary, withSuperAdmin } from './route-wrappers';
import { RouteErrorFallback } from './route-error-fallback';

const AccountSettingsPage = lazy(() =>
  import('@/features/auth/pages/AccountSettingsPage').then((m) => ({
    default: m.AccountSettingsPage,
  }))
);
const InvitationCodesPage = lazy(() =>
  import('@/features/auth/pages/InvitationCodesPage').then((m) => ({
    default: m.InvitationCodesPage,
  }))
);
const UserManagementPage = lazy(() =>
  import('@/features/auth/pages/UserManagementPage').then((m) => ({
    default: m.UserManagementPage,
  }))
);

export const authRoutes: RouteObject[] = [
  {
    path: '/settings',
    element: withSuspense(AccountSettingsPage),
  },
  {
    path: '/invitation-codes',
    element: withSuperAdmin(withSuspense(InvitationCodesPage)),
  },
  {
    path: '/users',
    element: withErrorBoundary(
      withSuperAdmin(withSuspense(UserManagementPage)),
      <RouteErrorFallback
        title="User Management Error"
        message="An error occurred while loading users. Ensure you have the required roles."
        borderColor="border-red-100"
        buttonColor="bg-red-600 hover:bg-red-700"
      />
    ),
  },
];
