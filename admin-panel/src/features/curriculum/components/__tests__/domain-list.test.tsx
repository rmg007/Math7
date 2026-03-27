import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { DomainList } from '../domain-list';
import * as useDomainsStateModule from '../../hooks/use-domains-state';

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
vi.mock('../../hooks/use-domains-state', () => ({
  useDomainsState: vi.fn(),
  DOMAIN_TOGGLE_COLUMNS: [
    { key: 'title', header: 'Title', alwaysVisible: true },
    { key: 'sort_order', header: 'Order' },
    { key: 'updated_at', header: 'Last Updated' },
    { key: 'status', header: 'Status' },
  ],
}));

// Mock sub-components
vi.mock('../domains/domain-toolbar', () => ({
  DomainToolbar: () => <div data-testid="mock-toolbar">Toolbar</div>,
}));

vi.mock('./curriculum-filter-bar', () => ({
  CurriculumFilterBar: () => <div data-testid="mock-filter-bar">Filter Bar</div>,
}));

vi.mock('@/components/ui/empty-state', () => ({
  EmptyState: ({ title }: any) => <div data-testid="mock-empty-state">{title}</div>,
}));

// Mock SortableRow
vi.mock('../domains/sortable-row', () => ({
  SortableRow: ({ domain }: any) => (
    <tr data-testid="domain-row">
      <td>{domain.title}</td>
    </tr>
  ),
}));

// Mock SortableCard
vi.mock('../domains/sortable-card', () => ({
  SortableCard: ({ domain }: any) => <div data-testid="domain-card">{domain.title}</div>,
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

const mockDomains = [
  {
    domain_id: 'd-1',
    title: 'Domain 1',
    slug: 'domain-1',
    sort_order: 1,
    status: 'draft',
    updated_at: new Date().toISOString(),
    app_id: 'app-1',
    apps: { display_name: 'Test App' },
  },
  {
    domain_id: 'd-2',
    title: 'Domain 2',
    slug: 'domain-2',
    sort_order: 2,
    status: 'live',
    updated_at: new Date().toISOString(),
    app_id: 'app-1',
    apps: { display_name: 'Test App' },
  },
];

const defaultMockState = {
  currentApp: { app_id: 'app-1', display_name: 'Test App' },
  isSuperAdmin: false,
  apps: [{ app_id: 'app-1', display_name: 'Test App' }],
  domains: mockDomains,
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
  selectedIds: new Set(),
  setSelectedIds: vi.fn(),
  sortBy: 'sort_order',
  sortOrder: 'asc',
  visibleColumns: new Set(['title', 'sort_order', 'updated_at', 'status']),
  setVisibleColumns: vi.fn(),
  deleteConfirmation: null,
  setDeleteConfirmation: vi.fn(),
  deleteImpact: { skillCount: 0, questionCount: 0, loading: false },
  appFilter: 'all',
  setAppFilter: vi.fn(),
  handleDragEnd: vi.fn(),
  handleSort: vi.fn(),
  handleSelectOne: vi.fn(),
  handleSelectAll: vi.fn(),
  handleDelete: vi.fn(),
  confirmDelete: vi.fn(),
  handleBulkStatusUpdate: vi.fn(),
  handleImport: vi.fn(),
  clearFilters: vi.fn(),
  isDragDisabled: false,
  isAllSelected: false,
  hasActiveFilters: false,
  fetchDeleteImpact: vi.fn(),
  isDeleting: false,
  isUpdating: false,
};

describe('DomainList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <DomainList />
      </BrowserRouter>
    );
  };

  it('renders loading state', () => {
    vi.mocked(useDomainsStateModule.useDomainsState).mockReturnValue({
      ...defaultMockState,
      isLoading: true,
      domains: [],
    } as any);

    renderComponent();
    expect(screen.getByTestId('domains-list-loading')).toBeTruthy();
  });

  it('renders domains', () => {
    vi.mocked(useDomainsStateModule.useDomainsState).mockReturnValue({
      ...defaultMockState,
    } as any);

    renderComponent();
    expect(screen.getAllByTestId('domain-row')).toHaveLength(2);
  });

  it('calls handleSelectAll when select all button is clicked', () => {
    vi.mocked(useDomainsStateModule.useDomainsState).mockReturnValue({
      ...defaultMockState,
    } as any);

    renderComponent();
    const selectAllBtn = screen.getByTestId('select-all-button');
    fireEvent.click(selectAllBtn);
    expect(defaultMockState.handleSelectAll).toHaveBeenCalled();
  });

  it('shows delete dialog when deleteConfirmation is set', () => {
    vi.mocked(useDomainsStateModule.useDomainsState).mockReturnValue({
      ...defaultMockState,
      deleteConfirmation: { type: 'single', id: 'd-1' },
    } as any);

    renderComponent();
    expect(screen.getByText('Delete Domain')).toBeTruthy();
  });

  it('calls confirmDelete when confirm is clicked in delete dialog', () => {
    vi.mocked(useDomainsStateModule.useDomainsState).mockReturnValue({
      ...defaultMockState,
      deleteConfirmation: { type: 'single', id: 'd-1' },
    } as any);

    renderComponent();
    const confirmBtn = screen.getByTestId('confirm-delete-button');
    fireEvent.click(confirmBtn);
    expect(defaultMockState.confirmDelete).toHaveBeenCalled();
  });
});
