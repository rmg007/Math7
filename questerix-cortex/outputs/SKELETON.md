# Codebase Skeleton
> Generated: 2026-02-25T15:56:59.963Z | 135 files | 485 exports
> **Load on demand** — fetch only the section(s) relevant to your current edit.

## App.tsx
### `App.tsx`
- **default** `function` `()`

## __tests__
### `__tests__/mocks/supabase-factory.ts`
- **createMockSupabase** `function` `(): MockSupabase` — Creates a fresh set of vi.fn() mocks for the Supabase client.
Call this inside a `beforeEach` or at the top of a `describe` block.
- **supabaseMockFactory** `function` `(mock: MockSupabase)` — Convenience: returns the vi.mock module factory for `@/lib/supabase`.
Use in `vi.mock('@/lib/supabase', supabaseMockFactory(mock))`.
- **MockQueryBuilder** `interface` `{ select, insert, update, delete, upsert, eq, … }`
- **MockSupabase** `interface` `{ client, mockFrom, mockRpc, queryBuilder }`

## components
### `components/ErrorBoundary.tsx`
- **ErrorBoundary** `class` `extends React.Component<ErrorBoundaryProps, ErrorBoundaryState>` — Error Boundary with Project Oracle Self-Healing Integration.

### `components/layout/app-layout.tsx`
- **AppLayout** `function` `()`

### `components/layout/sidebar.tsx`
- **Sidebar** `function` `({ isOpen = true, onClose, isMobile = false }: SidebarProps)`

### `components/ui/admin-header.tsx`
- **AdminHeader** `function` `({
  title,
  description,
  icon: Icon,
  actions,
  className,
  backTo
}: AdminHeaderProps)`

### `components/ui/alert-dialog.tsx`
- **AlertDialog** `const` `React.FC<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/@radix-ui/react-a…`
- **AlertDialogPortal** `const` `React.FC<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/@radix-ui/react-a…`
- **AlertDialogOverlay** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **AlertDialogTrigger** `const` `React.ForwardRefExoticComponent<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_mo…`
- **AlertDialogContent** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **AlertDialogHeader** `function` `({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>)`
- **AlertDialogHeader** `unknown` ``
- **AlertDialogFooter** `function` `({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>)`
- **AlertDialogFooter** `unknown` ``
- **AlertDialogTitle** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **AlertDialogDescription** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **AlertDialogAction** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **AlertDialogCancel** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`

### `components/ui/avatar.tsx`
- **Avatar** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **AvatarImage** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **AvatarFallback** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`

### `components/ui/badge.tsx`
- **BadgeProps** `interface` `{  }`
- **Badge** `function` `({ className, variant, ...props }: BadgeProps)`
- **badgeVariants** `const` `(props?: ConfigVariants<{ variant: { default: string; secondary: string; destructive: string; outline: string; }; }> & i…`

### `components/ui/breadcrumbs.tsx`
- **Breadcrumbs** `function` `({ items, className }: BreadcrumbsProps)`
- **BreadcrumbItem** `interface` `{ label, href }`

### `components/ui/bulk-action-bar.tsx`
- **BulkActionBar** `function` `({
  selectedCount,
  onClear,
  onDelete,
  actions,
  isDeleting,
}: BulkActionBarProps)`

### `components/ui/button_variants.ts`
- **buttonVariants** `const` `(props?: ConfigVariants<{ variant: { default: string; destructive: string; outline: string; secondary: string; ghost: st…`

### `components/ui/button.tsx`
- **ButtonProps** `interface` `{ asChild }`
- **Button** `const` `React.ForwardRefExoticComponent<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/src/com…`
- **buttonVariants** `const` `(props?: ConfigVariants<{ variant: { default: string; destructive: string; outline: string; secondary: string; ghost: st…`

### `components/ui/card.tsx`
- **Card** `const` `React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>`
- **CardHeader** `const` `React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>`
- **CardFooter** `const` `React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>`
- **CardTitle** `const` `React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>`
- **CardDescription** `const` `React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>`
- **CardContent** `const` `React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>`

### `components/ui/checkbox.tsx`
- **Checkbox** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`

### `components/ui/column-toggle.tsx`
- **ColumnToggle** `function` `({ columns, visibleColumns, onToggle }: ColumnToggleProps)`

### `components/ui/data-toolbar.tsx`
- **DataToolbar** `function` `({
  data,
  columns,
  entityName,
  onImport,
  importDisabled = false,
  importDisabledMessage = 'Import is not available',
}: DataToolbarProps<T>)`

### `components/ui/dialog.tsx`
- **Dialog** `const` `React.FC<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/@radix-ui/react-d…`
- **DialogPortal** `const` `React.FC<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/@radix-ui/react-d…`
- **DialogOverlay** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **DialogTrigger** `const` `React.ForwardRefExoticComponent<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_mo…`
- **DialogClose** `const` `React.ForwardRefExoticComponent<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_mo…`
- **DialogContent** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **DialogHeader** `function` `({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>)`
- **DialogHeader** `unknown` ``
- **DialogFooter** `function` `({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>)`
- **DialogFooter** `unknown` ``
- **DialogTitle** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **DialogDescription** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`

### `components/ui/dropdown-menu.tsx`
- **DropdownMenu** `const` `React.FC<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/@radix-ui/react-d…`
- **DropdownMenuTrigger** `const` `React.ForwardRefExoticComponent<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_mo…`
- **DropdownMenuContent** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **DropdownMenuItem** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **DropdownMenuCheckboxItem** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **DropdownMenuRadioItem** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **DropdownMenuLabel** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **DropdownMenuSeparator** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **DropdownMenuShortcut** `function` `({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>)`
- **DropdownMenuShortcut** `unknown` ``
- **DropdownMenuGroup** `const` `React.ForwardRefExoticComponent<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_mo…`
- **DropdownMenuPortal** `const` `React.FC<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/@radix-ui/react-d…`
- **DropdownMenuSub** `const` `React.FC<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/@radix-ui/react-d…`
- **DropdownMenuSubContent** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **DropdownMenuSubTrigger** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **DropdownMenuRadioGroup** `const` `React.ForwardRefExoticComponent<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_mo…`

### `components/ui/empty-state.tsx`
- **EmptyState** `function` `({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps)`

### `components/ui/form-actions.tsx`
- **FormActions** `function` `({
  isSubmitting,
  submitLabel = 'Save',
  submittingLabel = 'Saving...',
  cancelLabel = 'Cancel',
  onCancel,
  className,
}: FormActionsProps)`

### `components/ui/form.tsx`
- **useFormField** `function` `()`
- **Form** `const` `<TFieldValues extends FieldValues, TContext = any, TTransformedValues = TFieldValues>(props: import("C:/Users/mhali/OneD…`
- **FormItem** `const` `React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>`
- **FormLabel** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **FormControl** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **FormDescription** `const` `React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>`
- **FormMessage** `const` `React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>`
- **FormField** `function` `({
  ...props
}: ControllerProps<TFieldValues, TName>)`

### `components/ui/input.tsx`
- **Input** `const` `React.ForwardRefExoticComponent<Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputEleme…`

### `components/ui/keyboard-shortcuts-dialog.tsx`
- **KeyboardShortcutsDialog** `function` `()`

### `components/ui/label.tsx`
- **Label** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`

### `components/ui/math-extensions.ts`
- **createInlineMathNode** `function` `(schema: { nodes: { inlineMath: { create: (attrs: { latex: string }) => unknown } } }, latex: string)`
- **createBlockMathNode** `function` `(schema: { nodes: { blockMath: { create: (attrs: { latex: string }) => unknown } } }, latex: string)`
- **InlineMath** `const` `import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/@tiptap/core/dist/index").…`
- **BlockMath** `const` `import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/@tiptap/core/dist/index").…`

### `components/ui/page-skeleton.tsx`
- **PageSkeleton** `function` `({ variant, rows = 5, className }: PageSkeletonProps)`
- **SkeletonFilterBar** `function` `()`
- **SkeletonListCard** `function` `()`
- **SkeletonListRow** `function` `()`

### `components/ui/pagination.tsx`
- **Pagination** `function` `({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps)`

### `components/ui/progress.tsx`
- **Progress** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`

### `components/ui/radio-group.tsx`
- **RadioGroup** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **RadioGroupItem** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`

### `components/ui/rich-text-editor.tsx`
- **RichTextEditor** `function` `({ value, onChange, placeholder, className }: RichTextEditorProps)`

### `components/ui/select.tsx`
- **Select** `const` `React.FC<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/@radix-ui/react-s…`
- **SelectContent** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **SelectGroup** `const` `React.ForwardRefExoticComponent<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_mo…`
- **SelectItem** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **SelectLabel** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **SelectScrollDownButton** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **SelectScrollUpButton** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **SelectSeparator** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **SelectTrigger** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **SelectValue** `const` `React.ForwardRefExoticComponent<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_mo…`

### `components/ui/separator.tsx`
- **Separator** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`

### `components/ui/sheet.tsx`
- **Sheet** `const` `React.FC<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/@radix-ui/react-d…`
- **SheetPortal** `const` `React.FC<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/@radix-ui/react-d…`
- **SheetOverlay** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **SheetTrigger** `const` `React.ForwardRefExoticComponent<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_mo…`
- **SheetClose** `const` `React.ForwardRefExoticComponent<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_mo…`
- **SheetContent** `const` `React.ForwardRefExoticComponent<SheetContentProps & React.RefAttributes<HTMLDivElement>>`
- **SheetHeader** `function` `({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>)`
- **SheetHeader** `unknown` ``
- **SheetFooter** `function` `({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>)`
- **SheetFooter** `unknown` ``
- **SheetTitle** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **SheetDescription** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`

### `components/ui/skeleton.tsx`
- **Skeleton** `function` `({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>)`

### `components/ui/sortable-header.tsx`
- **SortableHeader** `function` `({
  label,
  column,
  currentSortBy,
  currentSortOrder,
  onSort,
  className = '',
}: SortableHeaderProps)`

### `components/ui/status-badge.tsx`
- **StatusBadge** `function` `({ status, label, className, icon }: StatusBadgeProps)`
- **StatusType** `type` `| 'active'
  | 'inactive'
  | 'draft'
  | 'published'
  | 'exhausted'
  | 'resolved'
  | 'pending'
  | 'throttled…`

### `components/ui/switch.tsx`
- **Switch** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`

### `components/ui/table.tsx`
- **Table** `const` `React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableElement> & React.RefAttributes<HTMLTableElement>>`
- **TableHeader** `const` `React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableSectionElement> & React.RefAttributes<HTMLTableSectionElem…`
- **TableBody** `const` `React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableSectionElement> & React.RefAttributes<HTMLTableSectionElem…`
- **TableFooter** `const` `React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableSectionElement> & React.RefAttributes<HTMLTableSectionElem…`
- **TableHead** `const` `React.ForwardRefExoticComponent<React.ThHTMLAttributes<HTMLTableCellElement> & React.RefAttributes<HTMLTableCellElement>…`
- **TableRow** `const` `React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableRowElement> & React.RefAttributes<HTMLTableRowElement>>`
- **TableCell** `const` `React.ForwardRefExoticComponent<React.TdHTMLAttributes<HTMLTableCellElement> & React.RefAttributes<HTMLTableCellElement>…`
- **TableCaption** `const` `React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableCaptionElement> & React.RefAttributes<HTMLTableCaptionElem…`

### `components/ui/tabs.tsx`
- **Tabs** `const` `React.ForwardRefExoticComponent<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_mo…`
- **TabsList** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **TabsTrigger** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **TabsContent** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`

### `components/ui/textarea.tsx`
- **TextareaProps** `interface` `{  }`
- **Textarea** `const` `React.ForwardRefExoticComponent<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/src/com…`

### `components/ui/toast.tsx`
- **ToastProps** `type` `React.ComponentPropsWithoutRef<typeof Toast>`
- **ToastActionElement** `type` `React.ReactElement<typeof ToastAction>`
- **ToastProvider** `const` `React.FC<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/@radix-ui/react-t…`
- **ToastViewport** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **Toast** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **ToastTitle** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **ToastDescription** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **ToastClose** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`
- **ToastAction** `const` `React.ForwardRefExoticComponent<Omit<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/no…`

### `components/ui/toaster.tsx`
- **Toaster** `function` `()`

## config
### `config/env.ts`
- **validateEnv** `function` `(): void` — Validate that all required environment variables are set.
Call this at app startup to fail fast.
- **env** `const` `EnvConfig`

## contexts
### `contexts/AppContext.tsx`
- **AppProvider** `function` `({ children }: { children: ReactNode })`
- **useAppContext** `function` `()`

### `contexts/AppContextDefinition.ts`
- **AppContextType** `interface` `{ apps, currentApp, isLoading, setCurrentApp, refreshApps, isSidebarCollapsed, … }`
- **AppContext** `const` `React.Context<import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/src/contexts/AppContextDe…`

## features/ai-assistant
### `features/ai-assistant/api/generateQuestions.ts`
- **generateQuestions** `function` `(request: GenerateQuestionsRequest): Promise<GenerateQuestionsResponse>`
- **GenerateQuestionsRequest** `interface` `{ text, subject_type, difficulty_distribution, custom_instructions }`
- **GenerateQuestionsResponse** `interface` `{ questions, metadata }`

### `features/ai-assistant/api/governedGeneration.ts`
- **governedGenerateQuestions** `function` `(appId: string, request: GenerateQuestionsRequest): Promise<GovernedGenerationResponse>`
- **GovernedGenerationResponse** `interface` `{ validation, governance, quotaError }`

### `features/ai-assistant/api/validateContent.ts`
- **validateContent** `function` `(request: ValidationRequest): Promise<ValidationResponse>`
- **ValidationRule** `interface` `{ name, rule_type, params }`
- **QuestionData** `interface` `{ id, question, options, correct_answer }`
- **ValidationRequest** `interface` `{ questions, source_text, subject_type, rules }`
- **ValidationResponse** `interface` `{ overall_score, status, consensus_reached, findings, summary, metadata }`

### `features/ai-assistant/components/DocumentUploader.tsx`
- **DocumentUploader** `function` `({
  onTextExtracted,
  maxSizeMB = 10,
})`

### `features/ai-assistant/components/QuestionReviewGrid.tsx`
- **GeneratedQuestion** `interface` `{ id, text, question_type, difficulty, metadata, validation_errors }`
- **QuestionReviewGrid** `function` `({
  questions,
  onQuestionsChange,
})`

### `features/ai-assistant/pages/GenerationPage.tsx`
- **GenerationPage** `function` `()`

### `features/ai-assistant/pages/GovernancePage.tsx`
- **GovernancePage** `function` `()`

### `features/ai-assistant/pages/SessionsPage.tsx`
- **SessionsPage** `function` `()`

## features/ai-content
### `features/ai-content/pages/BulkImportPage.tsx`
- **default** `function` `()`

## features/auth
### `features/auth/components/auth-guard.tsx`
- **AuthGuard** `function` `({ children }: { children: React.ReactNode })`

### `features/auth/components/standard-admin-guard.tsx`
- **StandardAdminGuard** `function` `({ children }: { children: React.ReactNode })`

### `features/auth/components/super-admin-guard.tsx`
- **SuperAdminGuard** `function` `({ children }: { children: React.ReactNode })`

### `features/auth/pages/AccountSettingsPage.tsx`
- **AccountSettingsPage** `function` `()`

### `features/auth/pages/AuthConfirmPage.tsx`
- **AuthConfirmPage** `function` `()` — AuthConfirmPage — Safe relay page for Supabase auth email links.

WHY this page exists:
Microsoft Defender Safe Links (and similar corporate email scanners)
pre-fetch every link in an email to scan for malware. When they hit a
Supabase password-reset/magic-link URL directly, the OTP is consumed
and the user gets "link expired" errors before they ever click anything.

HOW it works:
Our email template links to:
  https://admin.questerix.com/auth/confirm#token_hash=XXX&type=recovery

The "#" (hash fragment) is NEVER sent to any server — it is client-side only.
Safe Links scans https://admin.questerix.com/auth/confirm (just an HTML page)
and cannot see anything after the "#". The OTP survives until the user clicks.

Token formats handled (in priority order):
1. Hash fragment:  #token_hash=...&type=... (our email template — Safe Links safe)
2. URL params:     ?token_hash=...&type=...  (Supabase PKCE redirect)
3. Hash fragment:  #access_token=...&type=...  (Supabase legacy implicit flow)

### `features/auth/pages/InvitationCodesPage.tsx`
- **InvitationCodesPage** `function` `()`

### `features/auth/pages/LoginPage.tsx`
- **LoginPage** `function` `()`

### `features/auth/pages/UserManagementPage.tsx`
- **UserManagementPage** `function` `()`

## features/curriculum
### `features/curriculum/components/curriculum-filter-bar.tsx`
- **CurriculumFilterBar** `function` `({
  searchPlaceholder,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  extraFilters,
  count,
  countLabel,
}: CurriculumFilterBarProps)`

### `features/curriculum/components/domain-form.tsx`
- **DomainForm** `function` `()`

### `features/curriculum/components/domain-list.tsx`
- **DomainList** `function` `()`

### `features/curriculum/components/file-uploader.tsx`
- **FileUploader** `function` `({ onFileParsed, onClear }: FileUploaderProps)`

### `features/curriculum/components/question-form.tsx`
- **QuestionForm** `function` `({ initialData }: QuestionFormProps)`

### `features/curriculum/components/question-list.tsx`
- **QuestionList** `function` `()`

### `features/curriculum/components/skill-form.tsx`
- **SkillForm** `function` `({ initialData }: SkillFormProps)`

### `features/curriculum/components/skill-list.tsx`
- **SkillList** `function` `()`

### `features/curriculum/components/studio-question-card.tsx`
- **StudioQuestionCard** `function` `({
  question,
  index,
  onToggleKeep,
  onCycleDifficulty,
  onShiftDifficulty,
  onRegenerate,
  onUpdate,
  isRegenerating = false,
}: StudioQuestionCardProps)`

### `features/curriculum/hooks/use-dashboard.ts`
- **useDashboardStats** `function` `()`
- **useRecentActivity** `function` `()`

### `features/curriculum/hooks/use-domains.ts`
- **useDomains** `function` `()`
- **usePaginatedDomains** `function` `(params: PaginationParams, appId?: string)`
- **useDomain** `function` `(domainId: string)`
- **useCreateDomain** `function` `()`
- **useUpdateDomain** `function` `()`
- **useDeleteDomain** `function` `()`
- **useBulkDeleteDomains** `function` `()`
- **useBulkUpdateDomainsStatus** `function` `()`
- **useUpdateDomainOrder** `function` `()`
- **useBulkCreateDomains** `function` `()`
- **useCheckDomainSlug** `function` `()`
- **DomainFormInput** `type` `{
  slug: string;
  title: string;
  description?: string;
  sort_order: number;
  status: CurriculumStatus;
  app_id?: …`

### `features/curriculum/hooks/use-publish.ts`
- **useCurriculumMeta** `function` `()`
- **usePaginatedPublishHistory** `function` `(params: {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
})`
- **usePublishPreview** `function` `()`
- **usePublishCurriculum** `function` `()`

### `features/curriculum/hooks/use-questions.ts`
- **useQuestions** `function` `(skillId?: string)`
- **usePaginatedQuestions** `function` `(params: PaginationParams, appFilter?: string)`
- **useQuestion** `function` `(question_id: string)`
- **useCreateQuestion** `function` `()`
- **useBulkCreateQuestions** `function` `()`
- **useUpdateQuestion** `function` `()`
- **useDeleteQuestion** `function` `()`
- **useBulkDeleteQuestions** `function` `()`
- **useBulkUpdateQuestionsStatus** `function` `()`
- **useDuplicateQuestion** `function` `()`
- **useUpdateQuestionOrder** `function` `()`
- **QuestionInsert** `type` `Database['public']['Tables']['questions']['Insert']`

### `features/curriculum/hooks/use-skills.ts`
- **useSkills** `function` `(domainId?: string)`
- **usePaginatedSkills** `function` `(params: PaginationParams, appFilter?: string)`
- **useSkill** `function` `(skill_id: string)`
- **useCreateSkill** `function` `()`
- **useUpdateSkill** `function` `()`
- **useDeleteSkill** `function` `()`
- **useBulkDeleteSkills** `function` `()`
- **useBulkUpdateSkillsStatus** `function` `()`
- **useDuplicateSkill** `function` `()`
- **useUpdateSkillOrder** `function` `()`
- **useBulkCreateSkills** `function` `()`
- **useCheckSkillSlug** `function` `()`
- **SkillFormInput** `type` `{
  domain_id: string;
  slug: string;
  title: string;
  description?: string;
  sort_order: number;
  status: Curricul…`

### `features/curriculum/index.ts`
- **DomainForm** `function` `()`
- **DomainList** `function` `()`
- **FileUploader** `function` `({ onFileParsed, onClear }: FileUploaderProps)`
- **QuestionForm** `function` `({ initialData }: QuestionFormProps)`
- **QuestionList** `function` `()`
- **SkillForm** `function` `({ initialData }: SkillFormProps)`
- **SkillList** `function` `()`
- **useDashboardStats** `function` `()`
- **useRecentActivity** `function` `()`
- **useDomains** `function` `()`
- **usePaginatedDomains** `function` `(params: PaginationParams, appId?: string)`
- **useDomain** `function` `(domainId: string)`
- **useCreateDomain** `function` `()`
- **useUpdateDomain** `function` `()`
- **useDeleteDomain** `function` `()`
- **useBulkDeleteDomains** `function` `()`
- **useBulkUpdateDomainsStatus** `function` `()`
- **useUpdateDomainOrder** `function` `()`
- **useBulkCreateDomains** `function` `()`
- **useCheckDomainSlug** `function` `()`
- **DomainFormInput** `type` `{
  slug: string;
  title: string;
  description?: string;
  sort_order: number;
  status: CurriculumStatus;
  app_id?: …`
- **useCurriculumMeta** `function` `()`
- **usePaginatedPublishHistory** `function` `(params: {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
})`
- **usePublishPreview** `function` `()`
- **usePublishCurriculum** `function` `()`
- **useQuestions** `function` `(skillId?: string)`
- **usePaginatedQuestions** `function` `(params: PaginationParams, appFilter?: string)`
- **useQuestion** `function` `(question_id: string)`
- **useCreateQuestion** `function` `()`
- **useBulkCreateQuestions** `function` `()`
- **useUpdateQuestion** `function` `()`
- **useDeleteQuestion** `function` `()`
- **useBulkDeleteQuestions** `function` `()`
- **useBulkUpdateQuestionsStatus** `function` `()`
- **useDuplicateQuestion** `function` `()`
- **useUpdateQuestionOrder** `function` `()`
- **QuestionInsert** `type` `Database['public']['Tables']['questions']['Insert']`
- **useSkills** `function` `(domainId?: string)`
- **usePaginatedSkills** `function` `(params: PaginationParams, appFilter?: string)`
- **useSkill** `function` `(skill_id: string)`
- **useCreateSkill** `function` `()`
- **useUpdateSkill** `function` `()`
- **useDeleteSkill** `function` `()`
- **useBulkDeleteSkills** `function` `()`
- **useBulkUpdateSkillsStatus** `function` `()`
- **useDuplicateSkill** `function` `()`
- **useUpdateSkillOrder** `function` `()`
- **useBulkCreateSkills** `function` `()`
- **useCheckSkillSlug** `function` `()`
- **SkillFormInput** `type` `{
  domain_id: string;
  slug: string;
  title: string;
  description?: string;
  sort_order: number;
  status: Curricul…`
- **CurriculumStatus** `type` `Database['public']['Enums']['curriculum_status']`
- **PaginationParams** `interface` `{ page, pageSize, search, status, domainId, skillId, … }`
- **PaginatedResponse** `interface` `{ data, totalCount, page, pageSize, totalPages }`
- **QuestionType** `type` `| 'multiple_choice'
  | 'mcq_multi'
  | 'text_input'
  | 'boolean'
  | 'reorder_steps'`
- **McqOption** `interface` `{ id, text }`
- **McqOptions** `interface` `{ options }`
- **BooleanOptions** `interface` `{ true_label, false_label }`
- **TextInputOptions** `interface` `{ placeholder }`
- **ReorderStepsOptions** `interface` `{ steps }`
- **QuestionOptions** `type` `| McqOptions
  | BooleanOptions
  | TextInputOptions
  | ReorderStepsOptions`
- **McqSolution** `interface` `{ correct_option_id }`
- **McqMultiSolution** `interface` `{ correct_ids }`
- **BooleanSolution** `interface` `{ correct_value }`
- **TextInputSolution** `interface` `{ exact_match }`
- **ReorderStepsSolution** `interface` `{ correct_order }`
- **QuestionSolution** `type` `| McqSolution
  | McqMultiSolution
  | BooleanSolution
  | TextInputSolution
  | ReorderStepsSolution`

### `features/curriculum/pages/ai-generator-page.tsx`
- **AIGeneratorPage** `function` `()`

### `features/curriculum/pages/dashboard-page.tsx`
- **DashboardPage** `function` `()`

### `features/curriculum/pages/domain-create-page.tsx`
- **DomainCreatePage** `function` `()`

### `features/curriculum/pages/domain-edit-page.tsx`
- **DomainEditPage** `function` `()`

### `features/curriculum/pages/domains-page.tsx`
- **DomainsPage** `function` `()`

### `features/curriculum/pages/publish-page.tsx`
- **PublishPage** `function` `()`

### `features/curriculum/pages/question-create-page.tsx`
- **QuestionCreatePage** `function` `()`

### `features/curriculum/pages/question-edit-page.tsx`
- **QuestionEditPage** `function` `()`

### `features/curriculum/pages/question-studio-page.tsx`
- **QuestionStudioPage** `function` `()`

### `features/curriculum/pages/questions-page.tsx`
- **QuestionsPage** `function` `()`

### `features/curriculum/pages/skill-create-page.tsx`
- **SkillCreatePage** `function` `()`

### `features/curriculum/pages/skill-edit-page.tsx`
- **SkillEditPage** `function` `()`

### `features/curriculum/pages/skills-page.tsx`
- **SkillsPage** `function` `()`

### `features/curriculum/pages/version-history-page.tsx`
- **VersionHistoryPage** `function` `()`

### `features/curriculum/types.ts`
- **CurriculumStatus** `type` `Database['public']['Enums']['curriculum_status']`
- **PaginationParams** `interface` `{ page, pageSize, search, status, domainId, skillId, … }`
- **PaginatedResponse** `interface` `{ data, totalCount, page, pageSize, totalPages }`
- **QuestionType** `type` `| 'multiple_choice'
  | 'mcq_multi'
  | 'text_input'
  | 'boolean'
  | 'reorder_steps'`
- **McqOption** `interface` `{ id, text }`
- **McqOptions** `interface` `{ options }`
- **BooleanOptions** `interface` `{ true_label, false_label }`
- **TextInputOptions** `interface` `{ placeholder }`
- **ReorderStepsOptions** `interface` `{ steps }`
- **QuestionOptions** `type` `| McqOptions
  | BooleanOptions
  | TextInputOptions
  | ReorderStepsOptions`
- **McqSolution** `interface` `{ correct_option_id }`
- **McqMultiSolution** `interface` `{ correct_ids }`
- **BooleanSolution** `interface` `{ correct_value }`
- **TextInputSolution** `interface` `{ exact_match }`
- **ReorderStepsSolution** `interface` `{ correct_order }`
- **QuestionSolution** `type` `| McqSolution
  | McqMultiSolution
  | BooleanSolution
  | TextInputSolution
  | ReorderStepsSolution`

## features/dashboard
### `features/dashboard/pages/DashboardPage.tsx`
- **DashboardPage** `function` `()`

## features/mentorship
### `features/mentorship/hooks/use-groups.ts`
- **useGroups** `function` `()`
- **Group** `type` `Database['public']['Tables']['groups']['Row']`

### `features/mentorship/pages/AssignmentCreatePage.tsx`
- **AssignmentCreatePage** `function` `()`

### `features/mentorship/pages/GroupCreatePage.tsx`
- **GroupCreatePage** `function` `()`

### `features/mentorship/pages/GroupDetailPage.tsx`
- **GroupDetailPage** `function` `()`

### `features/mentorship/pages/GroupsPage.tsx`
- **GroupsPage** `function` `()`

## features/monitoring
### `features/monitoring/hooks/use-error-logs.ts`
- **useErrorLogs** `function` `({
  status,
  appId,
  page = 1,
  pageSize = 50,
  search = '',
}: {
  status?: string;
  appId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
} = {})`
- **useErrorLogStats** `function` `()`
- **useUpdateErrorStatus** `function` `()`
- **useDeleteErrorLog** `function` `()`
- **usePromoteToIssue** `function` `()`
- **useBulkUpdateErrorStatus** `function` `()`
- **useBulkDeleteErrorLogs** `function` `()`
- **ErrorLog** `type` `Tables<'error_logs'>`

### `features/monitoring/hooks/use-known-issues-mutations.ts`
- **useCreateKnownIssue** `function` `()`
- **useUpdateKnownIssue** `function` `()`
- **useDeleteKnownIssue** `function` `()`
- **useBulkUpdateKnownIssueStatus** `function` `()`
- **useBulkDeleteKnownIssues** `function` `()`

### `features/monitoring/hooks/use-known-issues.ts`
- **useKnownIssues** `function` `()`
- **KnownIssue** `type` `Tables<'known_issues'>`

### `features/monitoring/pages/ErrorLogsPage.tsx`
- **ErrorLogsPage** `function` `()`

### `features/monitoring/pages/KnownIssuesPage.tsx`
- **KnownIssuesPage** `function` `()`

## features/platform
### `features/platform/hooks/use-apps.ts`
- **useApps** `function` `()`
- **useCreateApp** `function` `()`
- **useUpdateApp** `function` `()`
- **useDeleteApp** `function` `()`
- **useBulkUpdateAppsStatus** `function` `()`
- **useBulkDeleteApps** `function` `()`
- **useBulkCreateApps** `function` `()`
- **useCheckAppSubdomain** `function` `()`

### `features/platform/hooks/use-landings.ts`
- **useLandingPages** `function` `()`
- **useLandingPage** `function` `(appId: string)`
- **useUpdateLandingPage** `function` `()`
- **useCreateLandingPage** `function` `()`
- **LandingPage** `type` `Database['public']['Tables']['app_landing_pages']['Row']`
- **LandingPageUpdate** `type` `Database['public']['Tables']['app_landing_pages']['Update']`
- **LandingPageWithApp** `type` `LandingPage & { apps: { display_name: string; subdomain: string } | null }`

### `features/platform/hooks/use-subjects.ts`
- **useSubjects** `function` `()`
- **useCreateSubject** `function` `()`
- **useUpdateSubject** `function` `()`
- **useDeleteSubject** `function` `()`
- **useBulkUpdateSubjectsStatus** `function` `()`
- **useBulkDeleteSubjects** `function` `()`
- **useBulkCreateSubjects** `function` `()`
- **useCheckSubjectSlug** `function` `()`
- **Subject** `type` `Tables<'subjects'>`
- **SubjectInsert** `type` `TablesInsert<'subjects'>`
- **SubjectUpdate** `type` `TablesUpdate<'subjects'>`

### `features/platform/pages/AppsPage.tsx`
- **AppsPage** `function` `()`

### `features/platform/pages/LandingsPage.tsx`
- **LandingsPage** `function` `()`

### `features/platform/pages/SubjectsPage.tsx`
- **SubjectsPage** `function` `()`

## hooks
### `hooks/use-ai-generator.ts`
- **useAIGenerator** `function` `()`

### `hooks/use-app.ts`
- **useApp** `function` `()`

### `hooks/use-bulk-import.ts`
- **useBulkImport** `function` `()` — useBulkImport Hook

Provides a React-friendly interface for bulk-importing questions.
Handles queuing, parsing, progress tracking, and dry runs.

### `hooks/use-debounce.ts`
- **useDebounce** `function` `(value: T, delay: number): T`

### `hooks/use-studio-generator.ts`
- **useStudioGenerator** `function` `()`
- **QuestionType** `type` `| 'mcq'
  | 'mcq_multi'
  | 'text_input'
  | 'boolean'
  | 'reorder_steps'
  | 'matching'`
- **Difficulty** `type` `'easy' | 'medium' | 'hard'`
- **Domain** `type` `| 'Mathematics'
  | 'English Language'
  | 'History'
  | 'Science'
  | 'Computer Science'
  | 'General Knowledge'`
- **DifficultyMix** `type` `{
  easy: number;
  medium: number;
  hard: number;
}`
- **StudioConfig** `interface` `{ domain, topic, count, difficultyMix, questionTypes, customInstructions }`
- **StagedQuestion** `interface` `{ id, text, question_type, difficulty, metadata, kept, … }`
- **StudioStatus** `type` `'idle' | 'generating' | 'done' | 'error'`

### `hooks/use-toast.ts`
- **reducer** `function` `(state: State, action: Action): State`
- **toast** `function` `({ ...props }: Toast)`
- **useToast** `function` `()`

### `hooks/use-unsaved-changes-guard.ts`
- **useUnsavedChangesGuard** `function` `(isDirty: boolean, message = 'You have unsaved changes. Leave anyway?')` — Blocks navigation (both in-app and browser close/refresh) when there
are unsaved changes.  Works with `createBrowserRouter` only.

### `hooks/use-url-state.ts`
- **useUrlState** `function` `(key: string, defaultValue: string): [string, (value: string) => void]` — Syncs a piece of state (like a search filter) with URL query parameters.
Allows deep-linking and browser back/forward navigation for filter state.

## lib
### `lib/data-utils.ts`
- **exportToCSV** `function` `(data: T[], columns: DataColumn[], filename: string): void`
- **exportToJSON** `function` `(data: T[], filename: string): void`
- **downloadTemplate** `function` `(columns: DataColumn[], filename: string): void`
- **parseCSV** `function` `(csvText: string): Record<string, string>[]`
- **parseJSON** `function` `(jsonText: string): T[]`
- **readFileAsText** `function` `(file: File): Promise<string>`
- **downloadFile** `function` `(content: string, filename: string, mimeType: string): void`
- **DataColumn** `interface` `{ key, header, transform }`

### `lib/database.types.ts`
- **Json** `type` `string | number | boolean | null | { [key: string]: Json | undefined } | Json[]`
- **Database** `type` `{
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { Post…`
- **Tables** `type` `DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[Defa…`
- **TablesInsert** `type` `DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[Defau…`
- **TablesUpdate** `type` `DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[Defau…`
- **Enums** `type` `DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[Defaul…`
- **CompositeTypes** `type` `PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[Publ…`
- **Constants** `const` `{ readonly public: { readonly Enums: { readonly assignment_scope: readonly ["mandatory", "suggested"]; readonly assignme…`

### `lib/error-tracker.ts`
- **addBreadcrumb** `function` `(message: string, category?: string, data?: Record<string, unknown>): void` — Adds a breadcrumb to the current session context.
Useful for tracking user actions leading up to an error.
- **captureException** `function` `(error: Error | unknown, context?: ErrorContext): Promise<string | null>` — Captures an exception and logs it to Supabase.
Zero-cost alternative to Sentry.
- **captureMessage** `function` `(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): Promise<string | null>` — Captures a message (non-error event) to the error log.
- **setUser** `function` `(_userId: string, _email?: string): void` — Sets user context for future error reports.
- **initErrorTracking** `function` `(): void` — Global error handler for uncaught exceptions.

### `lib/file-parsers.ts`
- **parseFile** `function` `(file: File): Promise<ParsedFile>`
- **ParsedFile** `interface` `{ name, content, type }`

### `lib/labels.ts`
- **actions** `const` `{ readonly save: "Save Changes"; readonly cancel: "Cancel"; readonly delete: "Delete"; readonly create: "Create"; readon…`
- **emptyStates** `const` `{ readonly noResults: "No results found"; readonly noData: "Nothing here yet"; readonly noDomains: "No domains yet — cre…`
- **pages** `const` `{ readonly dashboard: { readonly title: "Dashboard"; readonly description: "Platform overview"; }; readonly domains: { r…`
- **confirmations** `const` `{ readonly deleteGeneric: (type: string) => { title: string; description: string; confirm: string; cancel: string; }; re…`
- **form** `const` `{ readonly name: "Name"; readonly title: "Title"; readonly description: "Description"; readonly email: "Email"; readonly…`
- **status** `const` `{ readonly active: "Active"; readonly inactive: "Inactive"; readonly draft: "Draft"; readonly published: "Published"; re…`

### `lib/normalization.ts`
- **normalizeString** `function` `(value: string | null | undefined): string` — Utility functions for normalizing user input throughout the Admin Panel.
Ensures data consistency (trimming, casing) before storage. Normalizes a string by trimming whitespace.
- **normalizeIdentifier** `function` `(value: string | null | undefined): string` — Normalizes a string for use as an identifier (slug, subdomain, etc.)
by trimming whitespace and converting to lowercase.
- **normalizeFormData** `function` `(data: T, config: {
    trim?: (keyof T)[];
    lowercase?: (keyof T)[];
  }): T` — Normalizes an object of form data by applying normalization to its fields.

### `lib/postgrest-utils.ts`
- **escapePostgrestSearch** `function` `(input: string): string` — Escapes special characters in PostgREST ilike searches
PostgREST uses SQL LIKE patterns where:
- % matches any sequence of characters
- _ matches any single character
- \ is the escape character
- **buildIlikeFilter** `function` `(column: string, search: string): string` — Builds a safe ilike filter for PostgREST searches

### `lib/sanitize.ts`
- **sanitizeHtml** `function` `(html: string | null | undefined): string` — Sanitize HTML content to prevent XSS attacks.
Uses DOMPurify to strip dangerous elements and attributes.

### `lib/supabase.ts`
- **supabaseUrl** `const` `any`
- **supabaseKey** `const` `any`
- **supabase** `const` `import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/@supabase/supabase-js/dist…`

### `lib/utils.ts`
- **cn** `function` `(...inputs: ClassValue[])` — Standard utility for merging Tailwind CSS classes safely.
- **normalizeIdentifier** `function` `(text: string | null | undefined): string` — Normalizes an identifier string (slug, code, email) to be safe for DB storage.
Trims whitespace and converts to lowercase.
Handles null/undefined gracefully.
- **formatIdentifier** `function` `(text: string | null | undefined): string` — Utility functions for formatting raw database strings into human-readable text.
- **sanitizeHtml** `function` `(html: string): string` — Sanitizes HTML content to prevent XSS attacks while preserving basic formatting.
- **isValidUUID** `function` `(uuid: string | undefined | null): uuid is string` — UUID validation helper
- **delay** `function` `(ms: number)`

### `lib/validation/import-schema.ts`
- **MultipleChoiceSchema** `const` `import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/zod/v3/types").ZodObject<{…`
- **McqMultiSchema** `const` `import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/zod/v3/types").ZodObject<{…`
- **TextInputSchema** `const` `import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/zod/v3/types").ZodObject<{…`
- **BooleanSchema** `const` `import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/zod/v3/types").ZodObject<{…`
- **ReorderSchema** `const` `import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/zod/v3/types").ZodObject<{…`
- **QueuedQuestionSchema** `const` `import("C:/Users/mhali/OneDrive/Desktop/Important Projects/Questerix/admin-panel/node_modules/zod/v3/types").ZodDiscrimi…`
- **QueuedQuestion** `type` `z.infer<typeof QueuedQuestionSchema>`
- **ImportBatch** `type` `QueuedQuestion[]`

## services
### `services/CurriculumService.ts`
- **ImportResult** `interface` `{ success, count, error, isDryRun }`
- **CurriculumService** `class` ``

### `services/OracleService.ts`
- **OracleResult** `interface` `{ id, content, file_path, breadcrumb, similarity }`
- **OracleService** `class` ``

### `services/SecurityLogger.ts`
- **SecurityEventSeverity** `type` `'info' | 'low' | 'medium' | 'high' | 'critical'`
- **SecurityEventData** `interface` `{ eventType, severity, metadata, appId }`
- **SecurityLogger** `const` `SecurityLoggerService`

## types
### `types/index.ts`
- **PaginationParams** `interface` `{ page, pageSize, sortBy, sortDirection, search, statusFilter }`
- **PaginatedResponse** `interface` `{ data, totalCount, page, pageSize, totalPages }`
- **Domain** `type` `Tables<'domains'>`
- **Skill** `type` `Tables<'skills'>`
- **Question** `type` `Tables<'questions'>`
- **Profile** `type` `Tables<'profiles'>`
- **App** `type` `Tables<'apps'>`
- **Subject** `type` `Tables<'subjects'>`
- **DomainRow** `type` `Domain`
- **QuestionRow** `type` `Question`
- **SkillRow** `type` `Skill`
- **ProfileRow** `type` `Profile`
- **CurriculumStatus** `type` `Database['public']['Enums']['curriculum_status']`
- **QuestionType** `type` `Database['public']['Enums']['question_type']`
- **DomainWithSkills** `interface` `{ skills }`
- **SkillWithQuestions** `interface` `{ questions }`
- **QuestionListItem** `type` `QuestionRow & {
  metadata?: Json;
  skills: { title: string; domains: { title: string } | null } | null;
  apps?: { dis…`
- **DomainListItem** `type` `DomainRow`
- **SkillReference** `type` `Pick<SkillRow, 'skill_id' | 'title'>`
- **UserProfile** `type` `Pick<
  ProfileRow,
  'id' | 'email' | 'full_name' | 'avatar_url' | 'role' | 'created_at'
>`
- **QuestionImportData** `interface` `{ content, type, points, status, options, solution, … }`

### `types/platform.ts`
- **App** `type` `Tables<'apps'>`
- **CompiledApp** `interface` `{ subjects }`
- **AppInsert** `type` `TablesInsert<'apps'>`
- **AppUpdate** `type` `TablesUpdate<'apps'>`

## utils
### `utils/csv-templates.ts`
- **BULK_IMPORT_TEMPLATE** `const` `{ content: string; type: string; points: number; explanation: string; options: string; solution: string; }[]`
- **downloadBulkImportTemplate** `function` `()`
