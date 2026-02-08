import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/ui/toast'
import { LoginPage } from './features/auth/pages/LoginPage'
import { AuthGuard } from './features/auth/components/auth-guard'
import { AppLayout } from './components/layout/app-layout'
// DashboardPage import removed
import { DomainsPage } from './features/curriculum/pages/domains-page'
import { DomainCreatePage } from './features/curriculum/pages/domain-create-page'
import { DomainEditPage } from './features/curriculum/pages/domain-edit-page'
import { SkillsPage } from './features/curriculum/pages/skills-page'
import { SkillCreatePage } from './features/curriculum/pages/skill-create-page'
import { SkillEditPage } from './features/curriculum/pages/skill-edit-page'
import { QuestionsPage } from './features/curriculum/pages/questions-page'
import { QuestionCreatePage } from './features/curriculum/pages/question-create-page'
import { QuestionEditPage } from './features/curriculum/pages/question-edit-page'
import { PublishPage } from './features/curriculum/pages/publish-page'
import { VersionHistoryPage } from './features/curriculum/pages/version-history-page'
import { GovernancePage } from './features/ai-assistant/pages/GovernancePage'
import { SubjectsPage } from './features/platform/pages/SubjectsPage'
import { AppsPage } from './features/platform/pages/AppsPage'
import { LandingsPage } from './features/platform/pages/LandingsPage'
import { AccountSettingsPage } from './features/auth/pages/AccountSettingsPage'
import { InvitationCodesPage } from './features/auth/pages/InvitationCodesPage'
import { UserManagementPage } from './features/auth/pages/UserManagementPage'
import { SuperAdminGuard } from './features/auth/components/super-admin-guard'
import { AppProvider } from './contexts/AppContext'
import { GroupsPage } from './features/mentorship/pages/GroupsPage'
import { GroupCreatePage } from './features/mentorship/pages/GroupCreatePage'
import { GroupDetailPage } from './features/mentorship/pages/GroupDetailPage'
import { AssignmentCreatePage } from './features/mentorship/pages/AssignmentCreatePage'
import { GenerationPage } from './features/ai-assistant/pages/GenerationPage'
import { SessionsPage } from './features/ai-assistant/pages/SessionsPage'
import { KnownIssuesPage } from './features/monitoring/pages/KnownIssuesPage'
import { ErrorLogsPage } from './features/monitoring/pages/ErrorLogsPage'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/groups/new" element={<GroupCreatePage />} />
                <Route path="/groups/:id" element={<GroupDetailPage />} />
                <Route path="/groups/:groupId/assignments/new" element={<AssignmentCreatePage />} />
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
          </BrowserRouter>
        </AppProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
