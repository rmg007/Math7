import { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingPage } from '@/components/layout/loading-page';
import { SuperAdminGuard } from '@/features/auth/components/super-admin-guard';
import { StandardAdminGuard } from '@/features/auth/components/standard-admin-guard';

export function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Component />
    </Suspense>
  );
}

export function withErrorBoundary(children: ReactNode, fallback?: ReactNode) {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}

export function withSuperAdmin(children: ReactNode) {
  return <SuperAdminGuard>{children}</SuperAdminGuard>;
}

export function withStandardAdmin(children: ReactNode) {
  return <StandardAdminGuard>{children}</StandardAdminGuard>;
}
