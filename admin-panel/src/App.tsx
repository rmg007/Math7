import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './features/auth/pages/LoginPage'
import { AuthGuard } from './features/auth/components/auth-guard'
import { AppLayout } from './components/layout/app-layout'
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

const queryClient = new QueryClient()

function Dashboard() {
    return (
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="mt-2 text-muted-foreground">Welcome to Math7 Admin</p>
        </div>
    )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }>
            <Route path="/" element={<Dashboard />} />
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
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
