import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/ui/toast'
import { LoginPage } from './features/auth/pages/LoginPage'
import { AuthGuard } from './features/auth/components/auth-guard'
import { AppLayout } from './components/layout/app-layout'
import { DashboardPage } from './features/curriculum/pages/dashboard-page'
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
import { AccountSettingsPage } from './features/auth/pages/AccountSettingsPage'
import { InvitationCodesPage } from './features/auth/pages/InvitationCodesPage'
import { UserManagementPage } from './features/auth/pages/UserManagementPage'
import { SuperAdminGuard } from './features/auth/components/super-admin-guard'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }>
            <Route path="/" element={<DashboardPage />} />
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
            <Route path="/users" element={
              <SuperAdminGuard>
                <UserManagementPage />
              </SuperAdminGuard>
            } />
            <Route path="/settings" element={<AccountSettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
