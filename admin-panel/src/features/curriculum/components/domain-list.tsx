import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { SortableHeader } from '@/components/ui/sortable-header';
import { Book, CheckSquare, Filter, Square } from 'lucide-react';
import { CurriculumFilterBar } from './curriculum-filter-bar';
import { useDomainsState, DOMAIN_TOGGLE_COLUMNS } from '../hooks/use-domains-state';
import { SortableRow } from './domains/sortable-row';
import { SortableCard } from './domains/sortable-card';
import { DomainToolbar } from './domains/domain-toolbar';
import { DomainDeleteDialog } from './domain-list-dialogs';
import { Button } from '@/components/ui/button';
import { ColumnToggle } from '@/components/ui/column-toggle';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export function DomainList() {
  const {
    currentApp,
    isSuperAdmin,
    apps,
    domains,
    totalCount,
    totalPages,
    isLoading,
    error,
    page,
    setPage,
    pageSize,
    setPageSize,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedIds,
    setSelectedIds,
    sortBy,
    sortOrder,
    visibleColumns,
    setVisibleColumns,
    deleteConfirmation,
    setDeleteConfirmation,
    deleteImpact,
    appFilter,
    setAppFilter,
    handleDragEnd,
    handleSort,
    handleSelectOne,
    handleSelectAll,
    handleDelete,
    confirmDelete,
    handleBulkStatusUpdate,
    handleImport,
    clearFilters,
    isDragDisabled,
    isAllSelected,
    hasActiveFilters,
    fetchDeleteImpact,
    isDeleting,
    isUpdating,
  } = useDomainsState();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6" data-testid="domains-list-loading">
        <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-gray-100 flex items-center gap-4">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3.5 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-3.5 bg-gray-200 rounded w-20 animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-sm text-red-600">Error loading domains. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!currentApp) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-md p-12 text-center">
          <p className="text-sm text-gray-500">Select an active app to access Domains.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="domains-list"
      data-hydration-complete={!isLoading}
      className="max-w-7xl mx-auto space-y-4 p-4 md:p-6"
    >
      <DomainToolbar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkDelete={() => {
          setDeleteConfirmation({ type: 'bulk' });
          fetchDeleteImpact(Array.from(selectedIds));
        }}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        domains={domains}
        onImport={handleImport}
        isDeleting={isDeleting}
        isUpdating={isUpdating}
      />

      <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
        <CurriculumFilterBar
          searchPlaceholder="Search domains..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          count={totalCount}
          countLabel={totalCount === 1 ? 'domain' : 'domains'}
          hasActiveFilters={Boolean(hasActiveFilters)}
          onClearFilters={clearFilters}
          extraFilters={
            <>
              {isSuperAdmin ? (
                <div className="relative">
                  <select
                    aria-label="Filter by app"
                    value={appFilter}
                    onChange={(e) => setAppFilter(e.target.value)}
                    className="h-8 appearance-none pl-3 pr-8 text-xs font-medium rounded border border-gray-200 bg-white text-gray-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 outline-none cursor-pointer"
                  >
                    <option value="all">All Apps</option>
                    {apps.map((app) => (
                      <option key={app.app_id} value={app.app_id}>
                        {app.display_name}
                      </option>
                    ))}
                  </select>
                  <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                </div>
              ) : undefined}
              <ColumnToggle
                columns={DOMAIN_TOGGLE_COLUMNS}
                visibleColumns={visibleColumns}
                onToggle={(key) =>
                  setVisibleColumns((prev) => {
                    const next = new Set(prev);
                    if (next.has(key)) next.delete(key);
                    else next.add(key);
                    return next;
                  })
                }
              />
            </>
          }
        />

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-8 px-2" />
                  <TableHead className="w-8 px-2">
                    <button
                      onClick={handleSelectAll}
                      data-testid="select-all-button"
                      className="text-gray-300 hover:text-teal-600 transition-colors"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="h-4 w-4 text-teal-600 font-bold" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  {visibleColumns.has('sort_order') && (
                    <TableHead className="text-center w-8">
                      <SortableHeader
                        label="#"
                        column="sort_order"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                  )}
                  <TableHead className="px-4">
                    <SortableHeader
                      label="Title"
                      column="title"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </TableHead>
                  {visibleColumns.has('updated_at') && (
                    <TableHead className="hidden lg:table-cell">
                      <SortableHeader
                        label="Last Updated"
                        column="updated_at"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has('status') && (
                    <TableHead>
                      <SortableHeader
                        label="Status"
                        column="status"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                  )}
                  <TableHead className="text-right px-4 border-l border-gray-100">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={domains.map((d) => d.domain_id)}
                  strategy={verticalListSortingStrategy}
                >
                  {domains.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12">
                        <EmptyState
                          icon={Book}
                          title="No domains found"
                          description={
                            hasActiveFilters
                              ? 'Try adjusting your filters.'
                              : 'Create your first category domain.'
                          }
                          action={
                            hasActiveFilters ? (
                              <Button variant="outline" onClick={clearFilters} className="h-9 px-3">
                                Clear Filters
                              </Button>
                            ) : undefined
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    domains.map((domain) => (
                      <SortableRow
                        key={domain.domain_id}
                        domain={domain}
                        isSelected={selectedIds.has(domain.domain_id)}
                        onSelect={handleSelectOne}
                        onDelete={handleDelete}
                        isDragDisabled={isDragDisabled}
                        visibleColumns={visibleColumns}
                      />
                    ))
                  )}
                </SortableContext>
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-4 space-y-3 bg-gray-50/50">
            <SortableContext
              items={domains.map((d) => d.domain_id)}
              strategy={verticalListSortingStrategy}
            >
              {domains.length === 0 ? (
                <div className="py-12">
                  <EmptyState
                    icon={Book}
                    title="No domains found"
                    description={
                      hasActiveFilters
                        ? 'Try adjusting your filters.'
                        : 'Create your first category domain.'
                    }
                  />
                </div>
              ) : (
                domains.map((domain) => (
                  <SortableCard
                    key={domain.domain_id}
                    domain={domain}
                    isSelected={selectedIds.has(domain.domain_id)}
                    onSelect={handleSelectOne}
                    onDelete={handleDelete}
                    isDragDisabled={isDragDisabled}
                    visibleColumns={visibleColumns}
                  />
                ))
              )}
            </SortableContext>
          </div>
        </DndContext>

        {totalCount > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/30">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>

      <DomainDeleteDialog
        isOpen={Boolean(deleteConfirmation)}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={confirmDelete}
        title={deleteConfirmation?.type === 'bulk' ? 'Delete Domains' : 'Delete Domain'}
        isDeleting={isDeleting}
        impact={deleteImpact}
      />
    </div>
  );
}
