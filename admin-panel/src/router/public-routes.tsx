import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { withSuspense } from './route-wrappers';

const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const AuthConfirmPage = lazy(() =>
  import('@/features/auth/pages/AuthConfirmPage').then((m) => ({ default: m.AuthConfirmPage }))
);

export const publicRoutes: RouteObject[] = [
  {
    path: '/login',
    element: withSuspense(LoginPage),
  },
  {
    path: '/auth/confirm',
    element: withSuspense(AuthConfirmPage),
  },
];
