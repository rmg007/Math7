/**
 * Centralized UI labels for the Admin Panel.
 *
 * Use these instead of hardcoding strings in components.
 * This makes future i18n, copy changes, and consistency audits trivial.
 */

// ── Common Actions ──────────────────────────────────────────────────
export const actions = {
  save: 'Save Changes',
  cancel: 'Cancel',
  delete: 'Delete',
  create: 'Create',
  edit: 'Edit',
  duplicate: 'Duplicate',
  close: 'Close',
  confirm: 'Confirm',
  submit: 'Submit',
  search: 'Search…',
  filter: 'Filter',
  clearFilters: 'Clear Filters',
  tryAgain: 'Try Again',
  goBack: 'Go Back',
  signIn: 'Sign In',
  signOut: 'Sign Out',
  createAccount: 'Create Account',
} as const;

// ── Empty States ────────────────────────────────────────────────────
export const emptyStates = {
  noResults: 'No results found',
  noData: 'Nothing here yet',
  noDomains: 'No domains yet — create one to get started',
  noSkills: 'No skills yet — add skills to this domain',
  noQuestions: 'No questions yet — create or import questions',
  noGroups: 'No groups yet — create one to start mentoring',
  noInviteCodes: 'No invitation codes generated yet',
  noUsers: 'No users found matching your search',
  noSessions: 'No AI sessions recorded yet',
  noErrorLogs: 'No errors — everything looks good!',
  noKnownIssues: 'No known issues — the system is healthy',
} as const;

// ── Page Titles / Descriptions ──────────────────────────────────────
export const pages = {
  dashboard: { title: 'Dashboard', description: 'Platform overview' },
  domains: { title: 'Domains', description: 'Knowledge areas' },
  skills: { title: 'Skills', description: 'Learning objectives' },
  questions: { title: 'Questions', description: 'Assessment items' },
  publish: { title: 'Publish', description: 'Release curriculum' },
  versions: { title: 'Version History', description: 'Published snapshots' },
  groups: { title: 'Groups', description: 'Mentorship groups' },
  invitationCodes: { title: 'Invitation Codes', description: 'Access management' },
  users: { title: 'Users', description: 'User administration' },
  settings: { title: 'Account Settings', description: 'Profile & preferences' },
  subjects: { title: 'Subjects', description: 'Platform subjects' },
  apps: { title: 'Apps', description: 'Connected applications' },
  landings: { title: 'Landing Pages', description: 'Public-facing pages' },
  aiGeneration: { title: 'AI Generation', description: 'Generate questions with AI' },
  aiSessions: { title: 'AI Sessions', description: 'Generation history' },
  aiImport: { title: 'Bulk Import', description: 'Import content at scale' },
  governance: { title: 'Governance', description: 'AI usage & policies' },
  errorLogs: { title: 'Error Logs', description: 'System error tracking' },
  knownIssues: { title: 'Known Issues', description: 'Tracked platform issues' },
} as const;

// ── Confirmation Dialogs ────────────────────────────────────────────
export const confirmations = {
  deleteGeneric: (type: string) => ({
    title: `Delete ${type}`,
    description: `This will permanently delete this ${type.toLowerCase()}. This action cannot be undone.`,
    confirm: 'Delete',
    cancel: 'Cancel',
  }),
  unsavedChanges: {
    title: 'Unsaved Changes',
    description: 'You have unsaved changes. Are you sure you want to leave?',
    confirm: 'Leave',
    cancel: 'Stay',
  },
  publish: {
    title: 'Publish Curriculum',
    description: 'This will create a new published version accessible to students.',
    confirm: 'Publish Now',
    cancel: 'Cancel',
  },
} as const;

// ── Form Labels ─────────────────────────────────────────────────────
export const form = {
  name: 'Name',
  title: 'Title',
  description: 'Description',
  email: 'Email',
  password: 'Password',
  status: 'Status',
  sortOrder: 'Sort Order',
  required: 'Required',
  optional: 'Optional',
} as const;

// ── Status Badges ───────────────────────────────────────────────────
export const status = {
  active: 'Active',
  inactive: 'Inactive',
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
  pending: 'Pending',
  error: 'Error',
  success: 'Success',
} as const;
