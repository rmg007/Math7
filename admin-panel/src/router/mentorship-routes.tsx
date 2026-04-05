import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { withSuspense, withStandardAdmin } from './route-wrappers';

const GroupsPage = lazy(() =>
  import('@/features/mentorship/pages/GroupsPage').then((m) => ({ default: m.GroupsPage }))
);
const GroupCreatePage = lazy(() =>
  import('@/features/mentorship/pages/GroupCreatePage').then((m) => ({
    default: m.GroupCreatePage,
  }))
);
const GroupDetailPage = lazy(() =>
  import('@/features/mentorship/pages/GroupDetailPage').then((m) => ({
    default: m.GroupDetailPage,
  }))
);
const StudentDetailPage = lazy(() =>
  import('@/features/mentorship/pages/StudentDetailPage').then((m) => ({
    default: m.StudentDetailPage,
  }))
);
const AssignmentCreatePage = lazy(() =>
  import('@/features/mentorship/pages/AssignmentCreatePage').then((m) => ({
    default: m.AssignmentCreatePage,
  }))
);

export const mentorshipRoutes: RouteObject[] = [
  {
    path: '/groups',
    element: withStandardAdmin(withSuspense(GroupsPage)),
  },
  {
    path: '/groups/new',
    element: withStandardAdmin(withSuspense(GroupCreatePage)),
  },
  {
    path: '/groups/:id',
    element: withStandardAdmin(withSuspense(GroupDetailPage)),
  },
  {
    path: '/students/:id',
    element: withStandardAdmin(withSuspense(StudentDetailPage)),
  },
  {
    path: '/groups/:groupId/assignments/new',
    element: withStandardAdmin(withSuspense(AssignmentCreatePage)),
  },
];
