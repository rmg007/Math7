import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { QuestionList } from '../question-list';
import * as useQuestionsStateModule from '../../hooks/use-questions-state';

// Mock the hook
vi.mock('../../hooks/use-questions-state', () => ({
  useQuestionsState: vi.fn(),
  QUESTION_TOGGLE_COLUMNS: [
    { key: 'content', header: 'Content', alwaysVisible: true },
    { key: 'type', header: 'Type' },
    { key: 'skill', header: 'Skill' },
    { key: 'points', header: 'Points' },
    { key: 'status', header: 'Status' },
  ],
}));

// Mock sub-components that might have complex internal logic or use context we don't want to provide
vi.mock('../questions/question-toolbar', () => ({
  QuestionToolbar: ({ onImport }: any) => (
    <div data-testid="mock-toolbar" onClick={() => onImport([])}>
      Toolbar
    </div>
  ),
}));

vi.mock('../curriculum-filter-bar', () => ({
  CurriculumFilterBar: () => <div data-testid="mock-filter-bar">Filter Bar</div>,
}));

vi.mock('@/components/ui/empty-state', () => ({
  EmptyState: ({ title }: any) => <div data-testid="mock-empty-state">{title}</div>,
}));

const mockQuestions = [
  {
    question_id: 'q-1',
    content: 'Question 1',
    type: 'multiple_choice',
    points: 1,
    status: 'draft',
    skill_id: 's-1',
    skills: { title: 'Skill 1', domains: { title: 'Domain 1' } },
  },
  {
    question_id: 'q-2',
    content: 'Question 2',
    type: 'multiple_choice',
    points: 2,
    status: 'live',
    skill_id: 's-2',
    skills: { title: 'Skill 2', domains: { title: 'Domain 2' } },
  },
];

const defaultMockState = {
  currentApp: { app_id: 'app-1', display_name: 'Test App' },
  questions: mockQuestions,
  totalCount: 2,
  totalPages: 1,
  isLoading: false,
  isError: false,
  error: null,
  page: 1,
  setPage: vi.fn(),
  pageSize: 10,
  setPageSize: vi.fn(),
  searchQuery: '',
  setSearchQuery: vi.fn(),
  statusFilter: 'all',
  setStatusFilter: vi.fn(),
  selectedSkillId: 'all',
  setSelectedSkillId: vi.fn(),
  appFilter: 'all',
  setAppFilter: vi.fn(),
  selectedIds: new Set(),
  setSelectedIds: vi.fn(),
  sortBy: 'sort_order',
  sortOrder: 'asc',
  visibleColumns: new Set(['content', 'type', 'skill', 'points', 'status']),
  setVisibleColumns: vi.fn(),
  deleteConfirmation: null,
  setDeleteConfirmation: vi.fn(),
  handleDragEnd: vi.fn(),
  handleSort: vi.fn(),
  handleSelectOne: vi.fn(),
  handleSelectAll: vi.fn(),
  handleBulkStatusUpdate: vi.fn(),
  handleDelete: vi.fn(),
  confirmDelete: vi.fn(),
  handleDuplicate: vi.fn(),
  handleImport: vi.fn(),
  clearFilters: vi.fn(),
  isDragDisabled: false,
  isAllSelected: false,
  hasActiveFilters: false,
  isDeleting: false,
  isUpdating: false,
  isDuplicating: false,
};

describe('QuestionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <QuestionList />
      </BrowserRouter>
    );
  };

  it('renders loading state', () => {
    vi.mocked(useQuestionsStateModule.useQuestionsState).mockReturnValue({
      ...defaultMockState,
      isLoading: true,
      questions: [],
    } as any);

    renderComponent();
    expect(screen.queryByTestId('questions-list-loading')).toBeTruthy();
  });

  it('renders empty state when no questions found', () => {
    vi.mocked(useQuestionsStateModule.useQuestionsState).mockReturnValue({
      ...defaultMockState,
      questions: [],
      totalCount: 0,
    } as any);

    renderComponent();
    expect(screen.getAllByText('The reservoir is dry')[0]).toBeTruthy();
  });

  it('renders question rows when data is present', () => {
    vi.mocked(useQuestionsStateModule.useQuestionsState).mockReturnValue(defaultMockState as any);

    renderComponent();
    expect(screen.getAllByText('Question 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Question 2').length).toBeGreaterThan(0);
  });

  it('calls handleSelectAll when select all button is clicked', () => {
    vi.mocked(useQuestionsStateModule.useQuestionsState).mockReturnValue(defaultMockState as any);

    renderComponent();
    // Use the explicit test ID added to the header checkbox
    const selectAllBtn = screen.getByTestId('select-all-button');
    fireEvent.click(selectAllBtn);
    expect(defaultMockState.handleSelectAll).toHaveBeenCalled();
  });

  it('shows delete dialog when deleteConfirmation is set', () => {
    vi.mocked(useQuestionsStateModule.useQuestionsState).mockReturnValue({
      ...defaultMockState,
      deleteConfirmation: { type: 'single', id: 'q-1' },
    } as any);

    renderComponent();
    // The dialog text is "Delete unit?" which matches /Delete unit\?/i
    expect(screen.getByText(/Delete unit\?/i)).toBeTruthy();
  });

  it('calls confirmDelete when confirm is clicked in delete dialog', () => {
    vi.mocked(useQuestionsStateModule.useQuestionsState).mockReturnValue({
      ...defaultMockState,
      deleteConfirmation: { type: 'single', id: 'q-1' },
    } as any);

    renderComponent();
    // The "Delete" button in the dialog has explicit text
    const deleteBtn = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(deleteBtn);
    expect(defaultMockState.confirmDelete).toHaveBeenCalled();
  });
});
