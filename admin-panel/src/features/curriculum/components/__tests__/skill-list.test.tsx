import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { SkillList } from '../skill-list';
import * as useSkillsStateModule from '../../hooks/use-skills-state';

// Mock sensors to avoid dnd-kit initialization issues in tests
vi.mock('@dnd-kit/core', async () => {
  return {
    closestCenter: vi.fn(),
    PointerSensor: vi.fn(),
    TouchSensor: vi.fn(),
    KeyboardSensor: vi.fn(),
    useSensor: vi.fn(),
    useSensors: vi.fn(() => []),
    DndContext: ({ children }: any) => <div data-testid="mock-dnd-context">{children}</div>,
  };
});

// Mock the hook
vi.mock('../../hooks/use-skills-state', () => ({
  useSkillsState: vi.fn(),
  SKILL_TOGGLE_COLUMNS: [
    { key: 'title', header: 'Title', alwaysVisible: true },
    { key: 'domain', header: 'Domain' },
    { key: 'difficulty', header: 'Difficulty' },
    { key: 'status', header: 'Status' },
  ],
}));

// Mock sub-components
vi.mock('../skills/skill-toolbar', () => ({
  SkillToolbar: () => <div data-testid="mock-toolbar">Toolbar</div>,
}));

vi.mock('./curriculum-filter-bar', () => ({
  CurriculumFilterBar: () => <div data-testid="mock-filter-bar">Filter Bar</div>,
}));

vi.mock('@/components/ui/empty-state', () => ({
  EmptyState: ({ title }: any) => <div data-testid="mock-empty-state">{title}</div>,
}));

// Mock SortableRow
vi.mock('../skills/sortable-row', () => ({
  SortableRow: ({ skill }: any) => (
    <tr data-testid="skill-row">
      <td>{skill.title}</td>
    </tr>
  ),
}));

// Mock SortableCard
vi.mock('../skills/sortable-card', () => ({
  SortableCard: ({ skill }: any) => <div data-testid="skill-card">{skill.title}</div>,
}));

// Mock sortable context
vi.mock('@dnd-kit/sortable', async () => {
  return {
    SortableContext: ({ children }: any) => (
      <table>
        <tbody>{children}</tbody>
      </table>
    ),
    verticalListSortingStrategy: {},
    sortableKeyboardCoordinates: {},
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
    }),
  };
});

// Mock SkillDeleteDialog
vi.mock('../skill-list-dialogs', () => ({
  SkillDeleteDialog: ({ open }: any) =>
    open ? <div data-testid="delete-dialog">Delete Dialog</div> : null,
}));

const mockSkills = [
  {
    skill_id: 's-1',
    title: 'Skill 1',
    slug: 'skill-1',
    sort_order: 1,
    status: 'draft',
    domain_id: 'd-1',
    domains: { title: 'Domain 1' },
  },
  {
    skill_id: 's-2',
    title: 'Skill 2',
    slug: 'skill-2',
    sort_order: 2,
    status: 'live',
    domain_id: 'd-1',
    domains: { title: 'Domain 1' },
  },
];

const defaultMockState = {
  isSuperAdmin: false,
  apps: [],
  domains: [{ domain_id: 'd-1', title: 'Domain 1' }],
  skills: mockSkills,
  totalCount: 2,
  totalPages: 1,
  isLoading: false,
  error: null,
  page: 1,
  setPage: vi.fn(),
  pageSize: 10,
  setPageSize: vi.fn(),
  searchQuery: '',
  setSearchQuery: vi.fn(),
  statusFilter: 'all',
  setStatusFilter: vi.fn(),
  selectedDomainId: 'all',
  setSelectedDomainId: vi.fn(),
  selectedIds: new Set(),
  setSelectedIds: vi.fn(),
  sortBy: 'sort_order',
  sortOrder: 'asc',
  visibleColumns: new Set(['title', 'domain', 'difficulty', 'status']),
  setVisibleColumns: vi.fn(),
  deleteConfirmation: null,
  setDeleteConfirmation: vi.fn(),
  appFilter: 'all',
  setAppFilter: vi.fn(),
  handleDragEnd: vi.fn(),
  handleSort: vi.fn(),
  handleSelectOne: vi.fn(),
  handleSelectAll: vi.fn(),
  handleDelete: vi.fn(),
  confirmDelete: vi.fn(),
  handleBulkStatusUpdate: vi.fn(),
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

describe('SkillList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <SkillList />
      </BrowserRouter>
    );
  };

  it('renders loading state', () => {
    vi.mocked(useSkillsStateModule.useSkillsState).mockReturnValue({
      ...defaultMockState,
      isLoading: true,
      skills: [],
    } as any);

    renderComponent();
    expect(screen.getByTestId('skills-list-loading')).toBeTruthy();
  });

  it('renders skills', () => {
    vi.mocked(useSkillsStateModule.useSkillsState).mockReturnValue({
      ...defaultMockState,
    } as any);

    renderComponent();
    expect(screen.getAllByTestId('skill-row')).toHaveLength(2);
  });

  it('calls handleSelectAll when select all button is clicked', () => {
    vi.mocked(useSkillsStateModule.useSkillsState).mockReturnValue({
      ...defaultMockState,
    } as any);

    renderComponent();
    // Use getByTestId for the select all button
    const selectAllBtn = screen.getByTestId('select-all-button');
    fireEvent.click(selectAllBtn);
    expect(defaultMockState.handleSelectAll).toHaveBeenCalled();
  });

  it('shows delete dialog when deleteConfirmation is set', () => {
    vi.mocked(useSkillsStateModule.useSkillsState).mockReturnValue({
      ...defaultMockState,
      deleteConfirmation: { type: 'single', id: 's-1' },
    } as any);

    renderComponent();
    expect(screen.getByTestId('delete-dialog')).toBeTruthy();
  });
});
