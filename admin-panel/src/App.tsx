import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useState } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppLayout } from './components/layout/app-layout';
import { ToastProvider } from './components/ui/toast';
import { Toaster } from './components/ui/toaster';
import { AppProvider } from './contexts/AppContext';
import { AuthGuard } from './features/auth/components/auth-guard';
import { StandardAdminGuard } from './features/auth/components/standard-admin-guard';
import { SuperAdminGuard } from './features/auth/components/super-admin-guard';
import { supabase } from './lib/supabase';

// Lazy loaded pages
const LoginPage = lazy(() =>
  import('./features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const DomainsPage = lazy(() =>
  import('./features/curriculum/pages/domains-page').then((m) => ({ default: m.DomainsPage }))
);
const DomainCreatePage = lazy(() =>
  import('./features/curriculum/pages/domain-create-page').then((m) => ({
    default: m.DomainCreatePage,
  }))
);
const DomainEditPage = lazy(() =>
  import('./features/curriculum/pages/domain-edit-page').then((m) => ({
    default: m.DomainEditPage,
  }))
);
const SkillsPage = lazy(() =>
  import('./features/curriculum/pages/skills-page').then((m) => ({ default: m.SkillsPage }))
);
const SkillCreatePage = lazy(() =>
  import('./features/curriculum/pages/skill-create-page').then((m) => ({
    default: m.SkillCreatePage,
  }))
);
const SkillEditPage = lazy(() =>
  import('./features/curriculum/pages/skill-edit-page').then((m) => ({ default: m.SkillEditPage }))
);
const QuestionsPage = lazy(() =>
  import('./features/curriculum/pages/questions-page').then((m) => ({ default: m.QuestionsPage }))
);
const QuestionCreatePage = lazy(() =>
  import('./features/curriculum/pages/question-create-page').then((m) => ({
    default: m.QuestionCreatePage,
  }))
);
const QuestionStudioPage = lazy(() =>
  import('./features/curriculum/pages/question-studio-page').then((m) => ({
    default: m.QuestionStudioPage,
  }))
);
const StudioHistoryPage = lazy(() =>
  import('./features/curriculum/pages/studio-history-page').then((m) => ({
    default: m.StudioHistoryPage,
  }))
);
const QuestionEditPage = lazy(() =>
  import('./features/curriculum/pages/question-edit-page').then((m) => ({
    default: m.QuestionEditPage,
  }))
);
const PublishPage = lazy(() =>
  import('./features/curriculum/pages/publish-page').then((m) => ({ default: m.PublishPage }))
);
const VersionHistoryPage = lazy(() =>
  import('./features/curriculum/pages/version-history-page').then((m) => ({
    default: m.VersionHistoryPage,
  }))
);
const GovernancePage = lazy(() =>
  import('./features/ai-assistant/pages/GovernancePage').then((m) => ({
    default: m.GovernancePage,
  }))
);
const SubjectsPage = lazy(() =>
  import('./features/platform/pages/SubjectsPage').then((m) => ({ default: m.SubjectsPage }))
);
const AppsPage = lazy(() =>
  import('./features/platform/pages/AppsPage').then((m) => ({ default: m.AppsPage }))
);
const LandingsPage = lazy(() =>
  import('./features/platform/pages/LandingsPage').then((m) => ({ default: m.LandingsPage }))
);
const BulkImportPage = lazy(() => import('./features/ai-content/pages/BulkImportPage'));
const AccountSettingsPage = lazy(() =>
  import('./features/auth/pages/AccountSettingsPage').then((m) => ({
    default: m.AccountSettingsPage,
  }))
);
const AuthConfirmPage = lazy(() =>
  import('./features/auth/pages/AuthConfirmPage').then((m) => ({
    default: m.AuthConfirmPage,
  }))
);
const InvitationCodesPage = lazy(() =>
  import('./features/auth/pages/InvitationCodesPage').then((m) => ({
    default: m.InvitationCodesPage,
  }))
);
const UserManagementPage = lazy(() =>
  import('./features/auth/pages/UserManagementPage').then((m) => ({
    default: m.UserManagementPage,
  }))
);
const GroupsPage = lazy(() =>
  import('./features/mentorship/pages/GroupsPage').then((m) => ({ default: m.GroupsPage }))
);
const GroupCreatePage = lazy(() =>
  import('./features/mentorship/pages/GroupCreatePage').then((m) => ({
    default: m.GroupCreatePage,
  }))
);
const GroupDetailPage = lazy(() =>
  import('./features/mentorship/pages/GroupDetailPage').then((m) => ({
    default: m.GroupDetailPage,
  }))
);
const StudentDetailPage = lazy(() =>
  import('./features/mentorship/pages/StudentDetailPage').then((m) => ({
    default: m.StudentDetailPage,
  }))
);
const AssignmentCreatePage = lazy(() =>
  import('./features/mentorship/pages/AssignmentCreatePage').then((m) => ({
    default: m.AssignmentCreatePage,
  }))
);
const GenerationPage = lazy(() =>
  import('./features/ai-assistant/pages/GenerationPage').then((m) => ({
    default: m.GenerationPage,
  }))
);
const SessionsPage = lazy(() =>
  import('./features/ai-assistant/pages/SessionsPage').then((m) => ({ default: m.SessionsPage }))
);
const KnownIssuesPage = lazy(() =>
  import('./features/monitoring/pages/KnownIssuesPage').then((m) => ({
    default: m.KnownIssuesPage,
  }))
);
const ErrorLogsPage = lazy(() =>
  import('./features/monitoring/pages/ErrorLogsPage').then((m) => ({ default: m.ErrorLogsPage }))
);
const DashboardPage = lazy(() =>
  import('./features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);

const LoadingPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
    <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-1000">
      <div className="relative">
        <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 shadow-2xl shadow-indigo-500/30 flex items-center justify-center animate-pulse">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-2xl animate-pulse delay-75" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-xl font-black text-slate-900 tracking-tight italic">INITIALIZING</h2>
        <p className="text-2xs font-black text-slate-700 uppercase tracking-[0.3em] ml-1">
          Secure Environment
        </p>
      </div>
    </div>
  </div>
);

const queryClient = new QueryClient();

// Role-based redirect for the root path
const RoleRedirect = () => {
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState('/login');

  useEffect(() => {
    const abortController = new AbortController();

    const checkRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (abortController.signal.aborted) return;

      if (!user) {
        setTarget('/login');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (abortController.signal.aborted) return;

      if (profile?.role === 'super_admin') {
        setTarget('/dashboard');
      } else {
        setTarget('/domains');
      }
      setLoading(false);
    };

    checkRole();

    return () => {
      abortController.abort();
    };
  }, []);

  if (loading) return <LoadingPage />;
  return <Navigate to={target} replace />;
};

// ---------------------------------------------------------------------------
// Route tree — data router format (enables useBlocker for unsaved-changes)
// ---------------------------------------------------------------------------
const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingPage />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    // Public route — no AuthGuard. Users arrive here from Supabase auth emails
    // (password reset, magic link, email confirmation). The page acts as a
    // safe relay: Microsoft Defender Safe Links pre-fetches pages but never
    // activates buttons, so the OTP is only consumed when the user clicks.
    path: '/auth/confirm',
    element: (
      <Suspense fallback={<LoadingPage />}>
        <AuthConfirmPage />
      </Suspense>
    ),
  },
  {
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { path: '/', element: <RoleRedirect /> },
      {
        path: '/dashboard',
        element: (
          <ErrorBoundary
            fallback={
              <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-indigo-100 text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Dashboard Error</h2>
                  <p className="text-gray-600 mb-6 font-medium">
                    Failed to load standard reporting metrics. Check your network or permissions.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            }
          >
            <SuperAdminGuard>
              <Suspense fallback={<LoadingPage />}>
                <DashboardPage />
              </Suspense>
            </SuperAdminGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/domains',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingPage />}>
              <DomainsPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: '/domains/new',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingPage />}>
              <DomainCreatePage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: '/domains/:id/edit',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingPage />}>
              <DomainEditPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: '/skills',
        element: (
          <ErrorBoundary
            fallback={
              <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-teal-100 text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Skills Directory Error</h2>
                  <p className="text-gray-600 mb-6 font-medium">
                    The skills catalog is temporarily unavailable. This might be due to a
                    synchronization issue.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all font-bold text-sm"
                  >
                    Refresh Catalog
                  </button>
                </div>
              </div>
            }
          >
            <Suspense fallback={<LoadingPage />}>
              <SkillsPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: '/skills/new',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingPage />}>
              <SkillCreatePage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: '/skills/:id/edit',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingPage />}>
              <SkillEditPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: '/questions',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingPage />}>
              <QuestionsPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: '/questions/new',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingPage />}>
              <QuestionCreatePage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: '/questions/studio',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingPage />}>
              <QuestionStudioPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: '/questions/studio/history',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingPage />}>
              <StudioHistoryPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: '/questions/:id/edit',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingPage />}>
              <QuestionEditPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: '/publish',
        element: (
          <Suspense fallback={<LoadingPage />}>
            <PublishPage />
          </Suspense>
        ),
      },
      {
        path: '/versions',
        element: (
          <Suspense fallback={<LoadingPage />}>
            <VersionHistoryPage />
          </Suspense>
        ),
      },
      {
        path: '/invitation-codes',
        element: (
          <SuperAdminGuard>
            <Suspense fallback={<LoadingPage />}>
              <InvitationCodesPage />
            </Suspense>
          </SuperAdminGuard>
        ),
      },
      {
        path: '/groups',
        element: (
          <StandardAdminGuard>
            <Suspense fallback={<LoadingPage />}>
              <GroupsPage />
            </Suspense>
          </StandardAdminGuard>
        ),
      },
      {
        path: '/groups/new',
        element: (
          <StandardAdminGuard>
            <Suspense fallback={<LoadingPage />}>
              <GroupCreatePage />
            </Suspense>
          </StandardAdminGuard>
        ),
      },
      {
        path: '/groups/:id',
        element: (
          <StandardAdminGuard>
            <Suspense fallback={<LoadingPage />}>
              <GroupDetailPage />
            </Suspense>
          </StandardAdminGuard>
        ),
      },
      {
        path: '/students/:id',
        element: (
          <StandardAdminGuard>
            <Suspense fallback={<LoadingPage />}>
              <StudentDetailPage />
            </Suspense>
          </StandardAdminGuard>
        ),
      },
      {
        path: '/groups/:groupId/assignments/new',
        element: (
          <StandardAdminGuard>
            <Suspense fallback={<LoadingPage />}>
              <AssignmentCreatePage />
            </Suspense>
          </StandardAdminGuard>
        ),
      },
      {
        path: '/ai-questions',
        element: (
          <Suspense fallback={<LoadingPage />}>
            <GenerationPage />
          </Suspense>
        ),
      },
      {
        path: '/ai-sessions',
        element: (
          <Suspense fallback={<LoadingPage />}>
            <SessionsPage />
          </Suspense>
        ),
      },
      {
        path: '/ai-import',
        element: (
          <Suspense fallback={<LoadingPage />}>
            <BulkImportPage />
          </Suspense>
        ),
      },
      {
        path: '/users',
        element: (
          <ErrorBoundary
            fallback={
              <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-red-100 text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">User Management Error</h2>
                  <p className="text-gray-600 mb-6 font-medium">
                    An error occurred while loading users. Ensure you have the required roles.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold text-sm"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            }
          >
            <SuperAdminGuard>
              <Suspense fallback={<LoadingPage />}>
                <UserManagementPage />
              </Suspense>
            </SuperAdminGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/governance',
        element: (
          <SuperAdminGuard>
            <Suspense fallback={<LoadingPage />}>
              <GovernancePage />
            </Suspense>
          </SuperAdminGuard>
        ),
      },
      {
        path: '/subjects',
        element: (
          <ErrorBoundary>
            <SuperAdminGuard>
              <Suspense fallback={<LoadingPage />}>
                <SubjectsPage />
              </Suspense>
            </SuperAdminGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/apps',
        element: (
          <ErrorBoundary
            fallback={
              <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-purple-100 text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Applications Error</h2>
                  <p className="text-gray-600 mb-6 font-medium">
                    Critical failure in application registry. Contact infrastructure team.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-bold text-sm"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            }
          >
            <SuperAdminGuard>
              <Suspense fallback={<LoadingPage />}>
                <AppsPage />
              </Suspense>
            </SuperAdminGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/landings',
        element: (
          <SuperAdminGuard>
            <Suspense fallback={<LoadingPage />}>
              <LandingsPage />
            </Suspense>
          </SuperAdminGuard>
        ),
      },
      {
        path: '/settings',
        element: (
          <Suspense fallback={<LoadingPage />}>
            <AccountSettingsPage />
          </Suspense>
        ),
      },
      {
        path: '/known-issues',
        element: (
          <SuperAdminGuard>
            <Suspense fallback={<LoadingPage />}>
              <KnownIssuesPage />
            </Suspense>
          </SuperAdminGuard>
        ),
      },
      {
        path: '/error-logs',
        element: (
          <ErrorBoundary
            fallback={
              <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-red-100 text-center">
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
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Error Logs Unavailable</h2>
                  <p className="text-gray-600 mb-6">
                    The error logs page encountered an issue. This may be due to missing database
                    tables or permissions.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold text-sm uppercase tracking-wide"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            }
          >
            <SuperAdminGuard>
              <Suspense fallback={<LoadingPage />}>
                <ErrorLogsPage />
              </Suspense>
            </SuperAdminGuard>
          </ErrorBoundary>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppProvider>
          <ErrorBoundary>
            <RouterProvider router={router} />
          </ErrorBoundary>
        </AppProvider>
      </ToastProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
