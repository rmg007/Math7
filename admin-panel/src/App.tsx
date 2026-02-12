import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
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
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppProvider>
          <ErrorBoundary>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Suspense fallback={<LoadingPage />}>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    element={
                      <AuthGuard>
                        <AppLayout />
                      </AuthGuard>
                    }
                  >
                    <Route path="/" element={<RoleRedirect />} />
                    <Route
                      path="/dashboard"
                      element={
                        <SuperAdminGuard>
                          <DashboardPage />
                        </SuperAdminGuard>
                      }
                    />
                    <Route path="/domains" element={<DomainsPage />} />
                    <Route path="/domains/new" element={<DomainCreatePage />} />
                    <Route path="/domains/:id/edit" element={<DomainEditPage />} />

                    <Route path="/skills" element={<SkillsPage />} />
                    <Route path="/skills/new" element={<SkillCreatePage />} />
                    <Route path="/skills/:id/edit" element={<SkillEditPage />} />

                    <Route path="/questions" element={<QuestionsPage />} />
                    <Route path="/questions/new" element={<QuestionCreatePage />} />
                    <Route path="/questions/:id/edit" element={<QuestionEditPage />} />

                    <Route path="/publish" element={<PublishPage />} />
                    <Route path="/versions" element={<VersionHistoryPage />} />
                    <Route
                      path="/invitation-codes"
                      element={
                        <SuperAdminGuard>
                          <InvitationCodesPage />
                        </SuperAdminGuard>
                      }
                    />
                    <Route
                      path="/groups"
                      element={
                        <StandardAdminGuard>
                          <GroupsPage />
                        </StandardAdminGuard>
                      }
                    />
                    <Route
                      path="/groups/new"
                      element={
                        <StandardAdminGuard>
                          <GroupCreatePage />
                        </StandardAdminGuard>
                      }
                    />
                    <Route
                      path="/groups/:id"
                      element={
                        <StandardAdminGuard>
                          <GroupDetailPage />
                        </StandardAdminGuard>
                      }
                    />
                    <Route
                      path="/groups/:groupId/assignments/new"
                      element={
                        <StandardAdminGuard>
                          <AssignmentCreatePage />
                        </StandardAdminGuard>
                      }
                    />
                    <Route path="/ai-questions" element={<GenerationPage />} />
                    <Route path="/ai-sessions" element={<SessionsPage />} />
                    <Route path="/ai-import" element={<BulkImportPage />} />
                    <Route
                      path="/users"
                      element={
                        <SuperAdminGuard>
                          <UserManagementPage />
                        </SuperAdminGuard>
                      }
                    />
                    <Route
                      path="/governance"
                      element={
                        <SuperAdminGuard>
                          <GovernancePage />
                        </SuperAdminGuard>
                      }
                    />
                    <Route
                      path="/platform/subjects"
                      element={
                        <SuperAdminGuard>
                          <SubjectsPage />
                        </SuperAdminGuard>
                      }
                    />
                    <Route
                      path="/platform/apps"
                      element={
                        <SuperAdminGuard>
                          <AppsPage />
                        </SuperAdminGuard>
                      }
                    />
                    <Route
                      path="/platform/landings"
                      element={
                        <SuperAdminGuard>
                          <LandingsPage />
                        </SuperAdminGuard>
                      }
                    />
                    <Route path="/settings" element={<AccountSettingsPage />} />
                    <Route path="/known-issues" element={<KnownIssuesPage />} />
                    <Route path="/error-logs" element={<ErrorLogsPage />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ErrorBoundary>
        </AppProvider>
      </ToastProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
