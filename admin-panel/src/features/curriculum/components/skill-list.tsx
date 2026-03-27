import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { SortableHeader } from '@/components/ui/sortable-header';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Filter, GripVertical, Layers, CheckSquare, Square } from 'lucide-react';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CurriculumFilterBar } from './curriculum-filter-bar';

import {
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  KeyboardSensor,
  closestCenter,
  DndContext,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { ColumnToggle } from '@/components/ui/column-toggle';
import { Button } from '@/components/ui/button';

import { SkillToolbar } from './skills/skill-toolbar';
import { SortableRow } from './skills/sortable-row';
import { SortableCard } from './skills/sortable-card';
import { SkillDeleteDialog } from './skill-list-dialogs';
import { useSkillsState, SKILL_TOGGLE_COLUMNS } from '../hooks/use-skills-state';

export function SkillList() {
  const {
    isSuperAdmin,
    apps,
    domains,
    skills,
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
    selectedDomainId,
    setSelectedDomainId,
    selectedIds,
    setSelectedIds,
    sortBy,
    sortOrder,
    visibleColumns,
    setVisibleColumns,
    deleteConfirmation,
    setDeleteConfirmation,
    appFilter,
    setAppFilter,
    handleDragEnd,
    handleSort,
    handleSelectOne,
    handleSelectAll,
    handleDelete,
    confirmDelete,
    handleBulkStatusUpdate,
    handleDuplicate,
    handleImport,
    clearFilters,
    isDragDisabled,
    isAllSelected,
    hasActiveFilters,
    isDeleting,
    isUpdating,
    isDuplicating,
  } = useSkillsState();

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

  const renderStatusBadge = useCallback((status: string) => {
    return <StatusBadge status={status.toLowerCase() as StatusType} />;
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6" data-testid="skills-list-loading">
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
          <p className="text-sm text-red-600">Error loading skills. Please try again.</p>
        </div>
      </div>
    );
  }

  const skillIds = skills.map((s) => s.skill_id);

  return (
    <div
      data-testid="skills-list"
      data-hydration-complete={!isLoading}
      className="max-w-7xl mx-auto space-y-4 p-4 md:p-6"
    >
      <SkillToolbar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkDelete={() => setDeleteConfirmation({ type: 'bulk' })}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        skills={skills as unknown as Record<string, unknown>[]}
        onImport={handleImport}
        isDeleting={isDeleting}
        isUpdating={isUpdating}
      />

      <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
        <CurriculumFilterBar
          searchPlaceholder="Search skills..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          count={totalCount}
          countLabel={totalCount === 1 ? 'skill' : 'skills'}
          extraFilters={
            <>
              <div className="relative">
                <select
                  aria-label="Filter by domain"
                  value={selectedDomainId}
                  onChange={(e) => setSelectedDomainId(e.target.value)}
                  className="h-8 appearance-none pl-3 pr-8 text-xs font-medium rounded border border-gray-200 bg-white text-gray-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 outline-none cursor-pointer"
                >
                  <option value="all">All Domains</option>
                  {domains?.map((domain) => (
                    <option key={domain.domain_id} value={domain.domain_id}>
                      {domain.title}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
              </div>
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
                </div>
              ) : undefined}
              <ColumnToggle
                columns={SKILL_TOGGLE_COLUMNS}
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
                  <TableHead className="w-8 px-2">
                    <GripVertical className="h-3.5 w-3.5 text-gray-300" />
                  </TableHead>
                  <TableHead className="w-8 px-2">
                    <button
                      onClick={handleSelectAll}
                      data-testid="select-all-button"
                      aria-label={isAllSelected ? 'Deselect all' : 'Select all'}
                      className="text-gray-300 hover:text-gray-500"
                    >
                      {isAllSelected && skills.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-teal-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="px-4">
                    <SortableHeader
                      label="Skill"
                      column="title"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </TableHead>
                  {visibleColumns.has('domain') && (
                    <TableHead>
                      <SortableHeader
                        label="Domain"
                        column="domain_id"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has('difficulty') && (
                    <TableHead className="text-center w-24">
                      <SortableHeader
                        label="Difficulty"
                        column="difficulty_level"
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
              <SortableContext items={skillIds} strategy={verticalListSortingStrategy}>
                <TableBody>
                  {!skills.length ? (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.size + 3} className="py-20">
                        <EmptyState
                          icon={Layers}
                          title={hasActiveFilters ? 'No matches found' : 'No skills yet'}
                          description={
                            hasActiveFilters
                              ? 'Try adjusting your search or filters.'
                              : 'Create your first skill to build your curriculum.'
                          }
                          action={
                            hasActiveFilters ? (
                              <Button
                                onClick={clearFilters}
                                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                              >
                                Clear Filters
                              </Button>
                            ) : (
                              <Link to="/skills/new">
                                <Button className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm">
                                  New Skill
                                </Button>
                              </Link>
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    skills.map((skill) => (
                      <SortableRow
                        key={skill.skill_id}
                        skill={skill}
                        isSelected={selectedIds.has(skill.skill_id)}
                        onSelect={handleSelectOne}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                        renderStatusBadge={renderStatusBadge}
                        isDragDisabled={isDragDisabled}
                        isDuplicating={isDuplicating}
                        visibleColumns={visibleColumns}
                      />
                    ))
                  )}
                </TableBody>
              </SortableContext>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-3">
            <SortableContext items={skillIds} strategy={verticalListSortingStrategy}>
              {!skills.length ? (
                <div className="py-12">
                  <EmptyState
                    icon={Layers}
                    title={hasActiveFilters ? 'No matches found' : 'No skills yet'}
                    description={
                      hasActiveFilters
                        ? 'Try adjusting your search or filters.'
                        : 'Create your first skill to get started.'
                    }
                    action={
                      hasActiveFilters ? (
                        <Button
                          onClick={clearFilters}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                        >
                          Clear Filters
                        </Button>
                      ) : (
                        <Link to="/skills/new">
                          <Button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm">
                            New Skill
                          </Button>
                        </Link>
                      )
                    }
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {skills.map((skill) => (
                    <SortableCard
                      key={skill.skill_id}
                      skill={skill}
                      isSelected={selectedIds.has(skill.skill_id)}
                      onSelect={handleSelectOne}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      renderStatusBadge={renderStatusBadge}
                      isDragDisabled={isDragDisabled}
                      isDuplicating={isDuplicating}
                      visibleColumns={visibleColumns}
                    />
                  ))}
                </div>
              )}
            </SortableContext>
          </div>
        </DndContext>

        {totalCount > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
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

      <SkillDeleteDialog
        open={Boolean(deleteConfirmation)}
        onOpenChange={(open) => !open && setDeleteConfirmation(null)}
        deleteType={deleteConfirmation?.type ?? 'single'}
        selectedCount={selectedIds.size}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
