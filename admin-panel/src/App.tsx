import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/ui/toast'
import { AuthGuard } from './features/auth/components/auth-guard'
import { AppLayout } from './components/layout/app-layout'
import { SuperAdminGuard } from './features/auth/components/super-admin-guard'
import { StandardAdminGuard } from './features/auth/components/standard-admin-guard'
import { AppProvider } from './contexts/AppContext'

// Lazy loaded pages
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const DomainsPage = lazy(() => import('./features/curriculum/pages/domains-page').then(m => ({ default: m.DomainsPage })))
const DomainCreatePage = lazy(() => import('./features/curriculum/pages/domain-create-page').then(m => ({ default: m.DomainCreatePage })))
const DomainEditPage = lazy(() => import('./features/curriculum/pages/domain-edit-page').then(m => ({ default: m.DomainEditPage })))
const SkillsPage = lazy(() => import('./features/curriculum/pages/skills-page').then(m => ({ default: m.SkillsPage })))
const SkillCreatePage = lazy(() => import('./features/curriculum/pages/skill-create-page').then(m => ({ default: m.SkillCreatePage })))
const SkillEditPage = lazy(() => import('./features/curriculum/pages/skill-edit-page').then(m => ({ default: m.SkillEditPage })))
const QuestionsPage = lazy(() => import('./features/curriculum/pages/questions-page').then(m => ({ default: m.QuestionsPage })))
const QuestionCreatePage = lazy(() => import('./features/curriculum/pages/question-create-page').then(m => ({ default: m.QuestionCreatePage })))
const QuestionEditPage = lazy(() => import('./features/curriculum/pages/question-edit-page').then(m => ({ default: m.QuestionEditPage })))
const PublishPage = lazy(() => import('./features/curriculum/pages/publish-page').then(m => ({ default: m.PublishPage })))
const VersionHistoryPage = lazy(() => import('./features/curriculum/pages/version-history-page').then(m => ({ default: m.VersionHistoryPage })))
const GovernancePage = lazy(() => import('./features/ai-assistant/pages/GovernancePage').then(m => ({ default: m.GovernancePage })))
const SubjectsPage = lazy(() => import('./features/platform/pages/SubjectsPage').then(m => ({ default: m.SubjectsPage })))
const AppsPage = lazy(() => import('./features/platform/pages/AppsPage').then(m => ({ default: m.AppsPage })))
const LandingsPage = lazy(() => import('./features/platform/pages/LandingsPage').then(m => ({ default: m.LandingsPage })))
const AccountSettingsPage = lazy(() => import('./features/auth/pages/AccountSettingsPage').then(m => ({ default: m.AccountSettingsPage })))
const InvitationCodesPage = lazy(() => import('./features/auth/pages/InvitationCodesPage').then(m => ({ default: m.InvitationCodesPage })))
const UserManagementPage = lazy(() => import('./features/auth/pages/UserManagementPage').then(m => ({ default: m.UserManagementPage })))
const GroupsPage = lazy(() => import('./features/mentorship/pages/GroupsPage').then(m => ({ default: m.GroupsPage })))
const GroupCreatePage = lazy(() => import('./features/mentorship/pages/GroupCreatePage').then(m => ({ default: m.GroupCreatePage })))
const GroupDetailPage = lazy(() => import('./features/mentorship/pages/GroupDetailPage').then(m => ({ default: m.GroupDetailPage })))
const AssignmentCreatePage = lazy(() => import('./features/mentorship/pages/AssignmentCreatePage').then(m => ({ default: m.AssignmentCreatePage })))
const GenerationPage = lazy(() => import('./features/ai-assistant/pages/GenerationPage').then(m => ({ default: m.GenerationPage })))
const SessionsPage = lazy(() => import('./features/ai-assistant/pages/SessionsPage').then(m => ({ default: m.SessionsPage })))
const KnownIssuesPage = lazy(() => import('./features/monitoring/pages/KnownIssuesPage').then(m => ({ default: m.KnownIssuesPage })))
const ErrorLogsPage = lazy(() => import('./features/monitoring/pages/ErrorLogsPage').then(m => ({ default: m.ErrorLogsPage })))

const LoadingPage = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-slate-500 font-medium">Loading...</p>
    </div>
  </div>
)

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<LoadingPage />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={
                  <AuthGuard>
                    <AppLayout />
                  </AuthGuard>
                }>
                  <Route path="/" element={<Navigate to="/domains" replace />} />
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
                  <Route path="/invitation-codes" element={
                    <SuperAdminGuard>
                      <InvitationCodesPage />
                    </SuperAdminGuard>
                  } />
                  <Route path="/groups" element={
                    <StandardAdminGuard>
                      <GroupsPage />
                    </StandardAdminGuard>
                  } />
                  <Route path="/groups/new" element={
                    <StandardAdminGuard>
                      <GroupCreatePage />
                    </StandardAdminGuard>
                  } />
                  <Route path="/groups/:id" element={
                    <StandardAdminGuard>
                      <GroupDetailPage />
                    </StandardAdminGuard>
                  } />
                  <Route path="/groups/:groupId/assignments/new" element={
                    <StandardAdminGuard>
                      <AssignmentCreatePage />
                    </StandardAdminGuard>
                  } />
                  <Route path="/ai-questions" element={<GenerationPage />} />
                  <Route path="/ai-sessions" element={<SessionsPage />} />
                  <Route path="/users" element={
                    <SuperAdminGuard>
                      <UserManagementPage />
                    </SuperAdminGuard>
                  } />
                  <Route path="/governance" element={
                    <SuperAdminGuard>
                      <GovernancePage />
                    </SuperAdminGuard>
                  } />
                  <Route path="/platform/subjects" element={
                    <SuperAdminGuard>
                      <SubjectsPage />
                    </SuperAdminGuard>
                  } />
                  <Route path="/platform/apps" element={
                    <SuperAdminGuard>
                      <AppsPage />
                    </SuperAdminGuard>
                  } />
                  <Route path="/platform/landings" element={
                    <SuperAdminGuard>
                      <LandingsPage />
                    </SuperAdminGuard>
                  } />
                  <Route path="/settings" element={<AccountSettingsPage />} />
                  <Route path="/known-issues" element={<KnownIssuesPage />} />
                  <Route path="/error-logs" element={<ErrorLogsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AppProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
