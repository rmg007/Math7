import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { SortableHeader } from '@/components/ui/sortable-header';
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
import { CheckSquare, Sparkles, Square } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CurriculumFilterBar } from './curriculum-filter-bar';
import { useQuestionsState, QUESTION_TOGGLE_COLUMNS } from '../hooks/use-questions-state';
import { SortableRow } from './questions/sortable-row';
import { SortableCard } from './questions/sortable-card';
import { QuestionToolbar } from './questions/question-toolbar';
import { QuestionDeleteDialog } from './question-list-dialogs';
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

export function QuestionList() {
  const {
    currentApp,
    questions,
    totalCount,
    totalPages,
    isLoading,
    isError,
    error,
    page,
    setPage,
    pageSize,
    setPageSize,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedSkillId,
    setSelectedSkillId,
    appFilter,
    setAppFilter,
    selectedIds,
    setSelectedIds,
    sortBy,
    sortOrder,
    visibleColumns,
    setVisibleColumns,
    deleteConfirmation,
    setDeleteConfirmation,
    handleDragEnd,
    handleSort,
    handleSelectOne,
    handleSelectAll,
    handleBulkStatusUpdate,
    handleDelete,
    confirmDelete,
    handleDuplicate,
    handleImport,
    clearFilters,
    isDragDisabled,
    isAllSelected,
    hasActiveFilters,
    isDeleting,
    isUpdating,
    isDuplicating,
  } = useQuestionsState();

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

  if (!currentApp) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-md p-12 text-center">
          <p className="text-sm text-gray-500">Select an active app to view Questions.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6" data-testid="questions-list-loading">
        <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-gray-100 flex items-center gap-4">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3.5 bg-gray-200 rounded w-48 animate-pulse" />
              <div className="h-3.5 bg-gray-200 rounded w-20 animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-sm text-red-600">
            Error loading questions: {error instanceof Error ? error.message : 'Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="questions-list"
      data-hydration-complete={!isLoading}
      className="max-w-7xl mx-auto space-y-10 pb-12"
    >
      <QuestionToolbar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkDelete={() => setDeleteConfirmation({ type: 'bulk' })}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        questions={questions}
        onImport={handleImport}
        isDeleting={isDeleting}
        isUpdating={isUpdating}
      />

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-1.5">
          <CurriculumFilterBar
            searchPlaceholder="Search questions..."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            selectedSkillId={selectedSkillId}
            onSkillChange={setSelectedSkillId}
            appFilter={appFilter}
            onAppChange={setAppFilter}
            hasActiveFilters={Boolean(hasActiveFilters)}
            onClearFilters={clearFilters}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/30">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center px-3 py-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-2">
                  Pool Size
                </span>
                <span className="text-sm font-bold text-teal-600 tabular-nums">{totalCount}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ColumnToggle
                columns={QUESTION_TOGGLE_COLUMNS}
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
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-8 px-2" />
                    <TableHead className="w-8 px-2">
                      <button
                        onClick={handleSelectAll}
                        data-testid="select-all-button"
                        className="text-gray-300 hover:text-teal-600 transition-colors"
                      >
                        {isAllSelected ? (
                          <CheckSquare className="h-4 w-4 text-teal-600" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="px-4">
                      <SortableHeader
                        label="Content"
                        column="content"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                    {visibleColumns.has('type') && (
                      <TableHead>
                        <SortableHeader
                          label="Type"
                          column="type"
                          currentSortBy={sortBy}
                          currentSortOrder={sortOrder}
                          onSort={handleSort}
                        />
                      </TableHead>
                    )}
                    {visibleColumns.has('skill') && <TableHead>Skill</TableHead>}
                    {visibleColumns.has('points') && (
                      <TableHead className="text-center">
                        <SortableHeader
                          label="Points"
                          column="points"
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
                    items={questions.map((q) => q.question_id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {questions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-20">
                          <EmptyState
                            icon={Sparkles}
                            title="The reservoir is dry"
                            description={
                              hasActiveFilters
                                ? 'No units match your current filter parameters.'
                                : 'Start building your curriculum by drafting your first unit.'
                            }
                            action={
                              hasActiveFilters ? (
                                <Button
                                  variant="outline"
                                  onClick={clearFilters}
                                  className="h-10 rounded-xl"
                                >
                                  Clear Filters
                                </Button>
                              ) : (
                                <Link to="/ai-questions">
                                  <Button className="h-10 rounded-xl bg-teal-600 hover:bg-teal-700">
                                    Summon AI
                                  </Button>
                                </Link>
                              )
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      questions.map((question) => (
                        <SortableRow
                          key={question.question_id}
                          question={question}
                          isSelected={selectedIds.has(question.question_id)}
                          onSelect={handleSelectOne}
                          onDelete={handleDelete}
                          onDuplicate={handleDuplicate}
                          isDragDisabled={isDragDisabled}
                          isDuplicating={isDuplicating}
                          visibleColumns={visibleColumns}
                        />
                      ))
                    )}
                  </SortableContext>
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-4 bg-gray-50/50">
              <SortableContext
                items={questions.map((q) => q.question_id)}
                strategy={verticalListSortingStrategy}
              >
                {questions.length === 0 ? (
                  <div className="py-12">
                    <EmptyState
                      icon={Sparkles}
                      title="The reservoir is dry"
                      description="No units found."
                    />
                  </div>
                ) : (
                  questions.map((question) => (
                    <SortableCard
                      key={question.question_id}
                      question={question}
                      isSelected={selectedIds.has(question.question_id)}
                      onSelect={handleSelectOne}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      isDragDisabled={isDragDisabled}
                      isDuplicating={isDuplicating}
                      visibleColumns={visibleColumns}
                    />
                  ))
                )}
              </SortableContext>
            </div>
          </DndContext>

          {totalCount > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30">
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
      </div>

      <QuestionDeleteDialog
        isOpen={Boolean(deleteConfirmation)}
        onClose={() => setDeleteConfirmation(null)}
        deleteType={deleteConfirmation?.type ?? 'single'}
        selectedCount={selectedIds.size}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
