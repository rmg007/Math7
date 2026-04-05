import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { withSuspense, withErrorBoundary } from './route-wrappers';
import { RouteErrorFallback } from './route-error-fallback';

const DomainsPage = lazy(() =>
  import('@/features/curriculum/pages/domains-page').then((m) => ({ default: m.DomainsPage }))
);
const DomainCreatePage = lazy(() =>
  import('@/features/curriculum/pages/domain-create-page').then((m) => ({
    default: m.DomainCreatePage,
  }))
);
const DomainEditPage = lazy(() =>
  import('@/features/curriculum/pages/domain-edit-page').then((m) => ({
    default: m.DomainEditPage,
  }))
);
const SkillsPage = lazy(() =>
  import('@/features/curriculum/pages/skills-page').then((m) => ({ default: m.SkillsPage }))
);
const SkillCreatePage = lazy(() =>
  import('@/features/curriculum/pages/skill-create-page').then((m) => ({
    default: m.SkillCreatePage,
  }))
);
const SkillEditPage = lazy(() =>
  import('@/features/curriculum/pages/skill-edit-page').then((m) => ({ default: m.SkillEditPage }))
);
const QuestionsPage = lazy(() =>
  import('@/features/curriculum/pages/questions-page').then((m) => ({ default: m.QuestionsPage }))
);
const QuestionCreatePage = lazy(() =>
  import('@/features/curriculum/pages/question-create-page').then((m) => ({
    default: m.QuestionCreatePage,
  }))
);
const QuestionStudioPage = lazy(() =>
  import('@/features/curriculum/pages/question-studio-page').then((m) => ({
    default: m.QuestionStudioPage,
  }))
);
const StudioHistoryPage = lazy(() =>
  import('@/features/curriculum/pages/studio-history-page').then((m) => ({
    default: m.StudioHistoryPage,
  }))
);
const QuestionEditPage = lazy(() =>
  import('@/features/curriculum/pages/question-edit-page').then((m) => ({
    default: m.QuestionEditPage,
  }))
);
const PublishPage = lazy(() =>
  import('@/features/curriculum/pages/publish-page').then((m) => ({ default: m.PublishPage }))
);
const VersionHistoryPage = lazy(() =>
  import('@/features/curriculum/pages/version-history-page').then((m) => ({
    default: m.VersionHistoryPage,
  }))
);

export const curriculumRoutes: RouteObject[] = [
  {
    path: '/domains',
    element: withErrorBoundary(withSuspense(DomainsPage)),
  },
  {
    path: '/domains/new',
    element: withErrorBoundary(withSuspense(DomainCreatePage)),
  },
  {
    path: '/domains/:id/edit',
    element: withErrorBoundary(withSuspense(DomainEditPage)),
  },
  {
    path: '/skills',
    element: withErrorBoundary(
      withSuspense(SkillsPage),
      <RouteErrorFallback
        title="Skills Directory Error"
        message="The skills catalog is temporarily unavailable. This might be due to a synchronization issue."
        buttonText="Refresh Catalog"
        borderColor="border-teal-100"
        buttonColor="bg-teal-600 hover:bg-teal-700"
      />
    ),
  },
  {
    path: '/skills/new',
    element: withErrorBoundary(withSuspense(SkillCreatePage)),
  },
  {
    path: '/skills/:id/edit',
    element: withErrorBoundary(withSuspense(SkillEditPage)),
  },
  {
    path: '/questions',
    element: withErrorBoundary(withSuspense(QuestionsPage)),
  },
  {
    path: '/questions/new',
    element: withErrorBoundary(withSuspense(QuestionCreatePage)),
  },
  {
    path: '/questions/studio',
    element: withErrorBoundary(withSuspense(QuestionStudioPage)),
  },
  {
    path: '/questions/studio/history',
    element: withErrorBoundary(withSuspense(StudioHistoryPage)),
  },
  {
    path: '/questions/:id/edit',
    element: withErrorBoundary(withSuspense(QuestionEditPage)),
  },
  {
    path: '/publish',
    element: withSuspense(PublishPage),
  },
  {
    path: '/versions',
    element: withSuspense(VersionHistoryPage),
  },
];
