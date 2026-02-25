# Codebase Skeleton — Summary
> Generated: 2026-02-25T15:56:59.963Z | 135 files | 485 exports
> Always load this first. For full signatures, load `SKELETON.md` section for the area you're editing.

| File | Key Exports |
|------|-------------|
| `__tests__/mocks/supabase-factory.ts` | `createMockSupabase`, `supabaseMockFactory`, `MockQueryBuilder` +1 |
| `App.tsx` | `default` |
| `components/ErrorBoundary.tsx` | `ErrorBoundary` |
| `components/layout/app-layout.tsx` | `AppLayout` |
| `components/layout/sidebar.tsx` | `Sidebar` |
| `components/ui/admin-header.tsx` | `AdminHeader` |
| `components/ui/alert-dialog.tsx` | `AlertDialog`, `AlertDialogPortal`, `AlertDialogOverlay` +10 |
| `components/ui/avatar.tsx` | `Avatar`, `AvatarImage`, `AvatarFallback` |
| `components/ui/badge.tsx` | `BadgeProps`, `Badge`, `badgeVariants` |
| `components/ui/breadcrumbs.tsx` | `Breadcrumbs`, `BreadcrumbItem` |
| `components/ui/bulk-action-bar.tsx` | `BulkActionBar` |
| `components/ui/button_variants.ts` | `buttonVariants` |
| `components/ui/button.tsx` | `ButtonProps`, `Button`, `buttonVariants` |
| `components/ui/card.tsx` | `Card`, `CardHeader`, `CardFooter` +3 |
| `components/ui/checkbox.tsx` | `Checkbox` |
| `components/ui/column-toggle.tsx` | `ColumnToggle` |
| `components/ui/data-toolbar.tsx` | `DataToolbar` |
| `components/ui/dialog.tsx` | `Dialog`, `DialogPortal`, `DialogOverlay` +9 |
| `components/ui/dropdown-menu.tsx` | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent` +13 |
| `components/ui/empty-state.tsx` | `EmptyState` |
| `components/ui/form-actions.tsx` | `FormActions` |
| `components/ui/form.tsx` | `useFormField`, `Form`, `FormItem` +5 |
| `components/ui/input.tsx` | `Input` |
| `components/ui/keyboard-shortcuts-dialog.tsx` | `KeyboardShortcutsDialog` |
| `components/ui/label.tsx` | `Label` |
| `components/ui/math-extensions.ts` | `createInlineMathNode`, `createBlockMathNode`, `InlineMath` +1 |
| `components/ui/page-skeleton.tsx` | `PageSkeleton`, `SkeletonFilterBar`, `SkeletonListCard` +1 |
| `components/ui/pagination.tsx` | `Pagination` |
| `components/ui/progress.tsx` | `Progress` |
| `components/ui/radio-group.tsx` | `RadioGroup`, `RadioGroupItem` |
| `components/ui/rich-text-editor.tsx` | `RichTextEditor` |
| `components/ui/select.tsx` | `Select`, `SelectContent`, `SelectGroup` +7 |
| `components/ui/separator.tsx` | `Separator` |
| `components/ui/sheet.tsx` | `Sheet`, `SheetPortal`, `SheetOverlay` +9 |
| `components/ui/skeleton.tsx` | `Skeleton` |
| `components/ui/sortable-header.tsx` | `SortableHeader` |
| `components/ui/status-badge.tsx` | `StatusBadge`, `StatusType` |
| `components/ui/switch.tsx` | `Switch` |
| `components/ui/table.tsx` | `Table`, `TableHeader`, `TableBody` +5 |
| `components/ui/tabs.tsx` | `Tabs`, `TabsList`, `TabsTrigger` +1 |
| `components/ui/textarea.tsx` | `TextareaProps`, `Textarea` |
| `components/ui/toast.tsx` | `ToastProps`, `ToastActionElement`, `ToastProvider` +6 |
| `components/ui/toaster.tsx` | `Toaster` |
| `config/env.ts` | `validateEnv`, `env` |
| `contexts/AppContext.tsx` | `AppProvider`, `useAppContext` |
| `contexts/AppContextDefinition.ts` | `AppContextType`, `AppContext` |
| `features/ai-assistant/api/generateQuestions.ts` | `generateQuestions`, `GenerateQuestionsRequest`, `GenerateQuestionsResponse` |
| `features/ai-assistant/api/governedGeneration.ts` | `governedGenerateQuestions`, `GovernedGenerationResponse` |
| `features/ai-assistant/api/validateContent.ts` | `validateContent`, `ValidationRule`, `QuestionData` +2 |
| `features/ai-assistant/components/DocumentUploader.tsx` | `DocumentUploader` |
| `features/ai-assistant/components/QuestionReviewGrid.tsx` | `GeneratedQuestion`, `QuestionReviewGrid` |
| `features/ai-assistant/pages/GenerationPage.tsx` | `GenerationPage` |
| `features/ai-assistant/pages/GovernancePage.tsx` | `GovernancePage` |
| `features/ai-assistant/pages/SessionsPage.tsx` | `SessionsPage` |
| `features/ai-content/pages/BulkImportPage.tsx` | `default` |
| `features/auth/components/auth-guard.tsx` | `AuthGuard` |
| `features/auth/components/standard-admin-guard.tsx` | `StandardAdminGuard` |
| `features/auth/components/super-admin-guard.tsx` | `SuperAdminGuard` |
| `features/auth/pages/AccountSettingsPage.tsx` | `AccountSettingsPage` |
| `features/auth/pages/AuthConfirmPage.tsx` | `AuthConfirmPage` |
| `features/auth/pages/InvitationCodesPage.tsx` | `InvitationCodesPage` |
| `features/auth/pages/LoginPage.tsx` | `LoginPage` |
| `features/auth/pages/UserManagementPage.tsx` | `UserManagementPage` |
| `features/curriculum/components/curriculum-filter-bar.tsx` | `CurriculumFilterBar` |
| `features/curriculum/components/domain-form.tsx` | `DomainForm` |
| `features/curriculum/components/domain-list.tsx` | `DomainList` |
| `features/curriculum/components/file-uploader.tsx` | `FileUploader` |
| `features/curriculum/components/question-form.tsx` | `QuestionForm` |
| `features/curriculum/components/question-list.tsx` | `QuestionList` |
| `features/curriculum/components/skill-form.tsx` | `SkillForm` |
| `features/curriculum/components/skill-list.tsx` | `SkillList` |
| `features/curriculum/components/studio-question-card.tsx` | `StudioQuestionCard` |
| `features/curriculum/hooks/use-dashboard.ts` | `useDashboardStats`, `useRecentActivity` |
| `features/curriculum/hooks/use-domains.ts` | `useDomains`, `usePaginatedDomains`, `useDomain` +9 |
| `features/curriculum/hooks/use-publish.ts` | `useCurriculumMeta`, `usePaginatedPublishHistory`, `usePublishPreview` +1 |
| `features/curriculum/hooks/use-questions.ts` | `useQuestions`, `usePaginatedQuestions`, `useQuestion` +9 |
| `features/curriculum/hooks/use-skills.ts` | `useSkills`, `usePaginatedSkills`, `useSkill` +10 |
| `features/curriculum/index.ts` | `DomainForm`, `DomainList`, `FileUploader` +63 |
| `features/curriculum/pages/ai-generator-page.tsx` | `AIGeneratorPage` |
| `features/curriculum/pages/dashboard-page.tsx` | `DashboardPage` |
| `features/curriculum/pages/domain-create-page.tsx` | `DomainCreatePage` |
| `features/curriculum/pages/domain-edit-page.tsx` | `DomainEditPage` |
| `features/curriculum/pages/domains-page.tsx` | `DomainsPage` |
| `features/curriculum/pages/publish-page.tsx` | `PublishPage` |
| `features/curriculum/pages/question-create-page.tsx` | `QuestionCreatePage` |
| `features/curriculum/pages/question-edit-page.tsx` | `QuestionEditPage` |
| `features/curriculum/pages/question-studio-page.tsx` | `QuestionStudioPage` |
| `features/curriculum/pages/questions-page.tsx` | `QuestionsPage` |
| `features/curriculum/pages/skill-create-page.tsx` | `SkillCreatePage` |
| `features/curriculum/pages/skill-edit-page.tsx` | `SkillEditPage` |
| `features/curriculum/pages/skills-page.tsx` | `SkillsPage` |
| `features/curriculum/pages/version-history-page.tsx` | `VersionHistoryPage` |
| `features/curriculum/types.ts` | `CurriculumStatus`, `PaginationParams`, `PaginatedResponse` +13 |
| `features/dashboard/pages/DashboardPage.tsx` | `DashboardPage` |
| `features/mentorship/hooks/use-groups.ts` | `useGroups`, `Group` |
| `features/mentorship/pages/AssignmentCreatePage.tsx` | `AssignmentCreatePage` |
| `features/mentorship/pages/GroupCreatePage.tsx` | `GroupCreatePage` |
| `features/mentorship/pages/GroupDetailPage.tsx` | `GroupDetailPage` |
| `features/mentorship/pages/GroupsPage.tsx` | `GroupsPage` |
| `features/monitoring/hooks/use-error-logs.ts` | `useErrorLogs`, `useErrorLogStats`, `useUpdateErrorStatus` +5 |
| `features/monitoring/hooks/use-known-issues-mutations.ts` | `useCreateKnownIssue`, `useUpdateKnownIssue`, `useDeleteKnownIssue` +2 |
| `features/monitoring/hooks/use-known-issues.ts` | `useKnownIssues`, `KnownIssue` |
| `features/monitoring/pages/ErrorLogsPage.tsx` | `ErrorLogsPage` |
| `features/monitoring/pages/KnownIssuesPage.tsx` | `KnownIssuesPage` |
| `features/platform/hooks/use-apps.ts` | `useApps`, `useCreateApp`, `useUpdateApp` +5 |
| `features/platform/hooks/use-landings.ts` | `useLandingPages`, `useLandingPage`, `useUpdateLandingPage` +4 |
| `features/platform/hooks/use-subjects.ts` | `useSubjects`, `useCreateSubject`, `useUpdateSubject` +8 |
| `features/platform/pages/AppsPage.tsx` | `AppsPage` |
| `features/platform/pages/LandingsPage.tsx` | `LandingsPage` |
| `features/platform/pages/SubjectsPage.tsx` | `SubjectsPage` |
| `hooks/use-ai-generator.ts` | `useAIGenerator` |
| `hooks/use-app.ts` | `useApp` |
| `hooks/use-bulk-import.ts` | `useBulkImport` |
| `hooks/use-debounce.ts` | `useDebounce` |
| `hooks/use-studio-generator.ts` | `useStudioGenerator`, `QuestionType`, `Difficulty` +5 |
| `hooks/use-toast.ts` | `reducer`, `toast`, `useToast` |
| `hooks/use-unsaved-changes-guard.ts` | `useUnsavedChangesGuard` |
| `hooks/use-url-state.ts` | `useUrlState` |
| `lib/data-utils.ts` | `exportToCSV`, `exportToJSON`, `downloadTemplate` +5 |
| `lib/database.types.ts` | `Json`, `Database`, `Tables` +5 |
| `lib/error-tracker.ts` | `addBreadcrumb`, `captureException`, `captureMessage` +2 |
| `lib/file-parsers.ts` | `parseFile`, `ParsedFile` |
| `lib/labels.ts` | `actions`, `emptyStates`, `pages` +3 |
| `lib/normalization.ts` | `normalizeString`, `normalizeIdentifier`, `normalizeFormData` |
| `lib/postgrest-utils.ts` | `escapePostgrestSearch`, `buildIlikeFilter` |
| `lib/sanitize.ts` | `sanitizeHtml` |
| `lib/supabase.ts` | `supabaseUrl`, `supabaseKey`, `supabase` |
| `lib/utils.ts` | `cn`, `normalizeIdentifier`, `formatIdentifier` +3 |
| `lib/validation/import-schema.ts` | `MultipleChoiceSchema`, `McqMultiSchema`, `TextInputSchema` +5 |
| `services/CurriculumService.ts` | `ImportResult`, `CurriculumService` |
| `services/OracleService.ts` | `OracleResult`, `OracleService` |
| `services/SecurityLogger.ts` | `SecurityEventSeverity`, `SecurityEventData`, `SecurityLogger` |
| `types/index.ts` | `PaginationParams`, `PaginatedResponse`, `Domain` +18 |
| `types/platform.ts` | `App`, `CompiledApp`, `AppInsert` +1 |
| `utils/csv-templates.ts` | `BULK_IMPORT_TEMPLATE`, `downloadBulkImportTemplate` |