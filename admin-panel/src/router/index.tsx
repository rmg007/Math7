import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { RoleRedirect } from './role-redirect';
import { publicRoutes } from './public-routes';
import { curriculumRoutes } from './curriculum-routes';
import { platformRoutes } from './platform-routes';
import { mentorshipRoutes } from './mentorship-routes';
import { aiRoutes } from './ai-routes';
import { monitoringRoutes } from './monitoring-routes';
import { dashboardRoutes } from './dashboard-routes';
import { authRoutes } from './auth-routes';

export const router = createBrowserRouter([
  ...publicRoutes,
  {
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { path: '/', element: <RoleRedirect /> },
      ...dashboardRoutes,
      ...curriculumRoutes,
      ...platformRoutes,
      ...mentorshipRoutes,
      ...aiRoutes,
      ...monitoringRoutes,
      ...authRoutes,
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
