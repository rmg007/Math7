import { AdminHeader } from '@/components/ui/admin-header';
import { BulkActionBar } from '@/components/ui/bulk-action-bar';
import { Button } from '@/components/ui/button';
import { ColumnToggle } from '@/components/ui/column-toggle';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { SortableHeader } from '@/components/ui/sortable-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Boxes, CheckCircle2, CheckSquare, Plus, Square } from 'lucide-react';

import { SubjectCard } from '../components/subjects/subject-card';
import { SubjectRow } from '../components/subjects/subject-row';
import { SubjectModals } from '../components/subjects/subject-modals';
import { SUBJECT_COLUMNS } from '../components/subjects/schema';
import { useSubjectsState } from '../hooks/use-subjects-state';
import { SearchToolbar, FilterToolbar, StatusFilter } from '../components/platform-toolbar';

export function SubjectsPage() {
  const {
    subjects,
    isLoading,
    selectedIds,
    setSelectedIds,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    visibleColumns,
    setVisibleColumns,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortBy,
    sortOrder,
    isDialogOpen,
    setIsDialogOpen,
    editingSubject,
    deleteConfirmation,
    setDeleteConfirmation,
    createSubject,
    updateSubject,
    form,
    handleOpenDialog,
    filteredSubjects,
    paginatedSubjects,
    handleSelectOne,
    handleSelectAll,
    handleBulkStatusUpdate,
    handleBulkDelete,
    confirmBulkDelete,
    handleImport,
    onSubmit,
    handleDelete,
    confirmSingleDelete,
    handleSort,
    isAllSelected,
  } = useSubjectsState();

  return (
    <>
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onDelete={handleBulkDelete}
        actions={[
          {
            label: 'Set Live',
            onClick: () => handleBulkStatusUpdate('live'),
            icon: <CheckCircle2 className="h-3.5 w-3.5" />,
            className: 'text-emerald-400 hover:bg-emerald-500/10',
          },
          {
            label: 'Draft',
            onClick: () => handleBulkStatusUpdate('draft'),
            className: 'text-slate-400 hover:bg-slate-500/10',
          },
        ]}
      />

      <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6" data-hydration-complete={!isLoading}>
        <AdminHeader
          title="Subjects"
          description="Manage subjects."
          icon={Boxes}
          className="mb-2"
          actions={
            <Button
              onClick={() => handleOpenDialog()}
              className="h-9 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Subject
            </Button>
          }
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6 p-2">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-2">
            <SearchToolbar
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
              }}
              count={filteredSubjects.length}
              countLabel="Pool"
              className="flex-1"
            />

            <FilterToolbar>
              <StatusFilter
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { label: 'All Status', value: 'all' },
                  { label: 'Draft', value: 'draft' },
                  { label: 'Published', value: 'published' },
                  { label: 'Live', value: 'live' },
                ]}
              />

              <ColumnToggle
                columns={SUBJECT_COLUMNS}
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

              <div className="w-px h-6 bg-gray-100 mx-1 hidden lg:block" />

              <DataToolbar
                data={subjects ?? []}
                columns={SUBJECT_COLUMNS}
                entityName="Subjects"
                onImport={handleImport}
              />
            </FilterToolbar>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-100 hover:bg-gray-50">
                  <TableHead className="w-8 px-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-gray-300 hover:text-teal-600 transition-colors"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="h-4 w-4 text-teal-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  {visibleColumns.has('title') && (
                    <TableHead className="px-4">
                      <SortableHeader
                        label="Title"
                        column="title"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has('slug') && (
                    <TableHead>
                      <SortableHeader
                        label="Slug"
                        column="slug"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has('icon_url') && (
                    <TableHead className="text-center">Icon</TableHead>
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
                  {visibleColumns.has('display_order') && (
                    <TableHead className="text-center">
                      <SortableHeader
                        label="Order"
                        column="display_order"
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="even:bg-gray-50/40">
                      <TableCell className="w-8 px-2">
                        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="h-3.5 bg-gray-200 rounded w-28 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-3.5 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-5 w-5 bg-gray-200 rounded mx-auto animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded-full w-14 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-3.5 bg-gray-200 rounded w-8 mx-auto animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex gap-0.5 justify-end">
                          <div className="h-7 w-7 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-7 w-7 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedSubjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-20 text-center">
                      <EmptyState
                        icon={Boxes}
                        title={searchQuery ? 'No matches found' : 'No subjects yet'}
                        description={
                          searchQuery
                            ? `No subjects match "${searchQuery}".`
                            : 'Create your first subject to get started.'
                        }
                        action={
                          searchQuery ? (
                            <Button
                              onClick={() => {
                                setSearchQuery('');
                                setCurrentPage(1);
                              }}
                              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                            >
                              Clear Search
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleOpenDialog()}
                              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                            >
                              New Subject
                            </Button>
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSubjects.map((subject) => (
                    <SubjectRow
                      key={subject.subject_id}
                      subject={subject}
                      isSelected={selectedIds.has(subject.subject_id)}
                      onSelect={handleSelectOne}
                      onEdit={handleOpenDialog}
                      onDelete={handleDelete}
                      visibleColumns={visibleColumns}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-3 bg-gray-50/30">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : paginatedSubjects.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={Boxes}
                  title={searchQuery ? 'No matches found' : 'No subjects yet'}
                  description={
                    searchQuery
                      ? `No subjects match "${searchQuery}".`
                      : 'Create your first subject to get started.'
                  }
                  action={
                    searchQuery ? (
                      <Button
                        onClick={() => {
                          setSearchQuery('');
                          setCurrentPage(1);
                        }}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                      >
                        Clear Search
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleOpenDialog()}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                      >
                        New Subject
                      </Button>
                    )
                  }
                />
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedSubjects.map((subject) => (
                  <SubjectCard
                    key={subject.subject_id}
                    subject={subject}
                    isSelected={selectedIds.has(subject.subject_id)}
                    onSelect={handleSelectOne}
                    onEdit={handleOpenDialog}
                    onDelete={handleDelete}
                    visibleColumns={visibleColumns}
                  />
                ))}
              </div>
            )}
          </div>

          {filteredSubjects.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredSubjects.length / pageSize)}
                totalCount={filteredSubjects.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>

        <SubjectModals
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          deleteConfirmation={deleteConfirmation}
          setDeleteConfirmation={setDeleteConfirmation}
          editingSubject={editingSubject}
          form={form}
          onSubmit={onSubmit}
          selectedCount={selectedIds.size}
          isPending={createSubject.isPending || updateSubject.isPending}
          confirmBulkDelete={confirmBulkDelete}
          confirmSingleDelete={confirmSingleDelete}
        />
      </div>
    </>
  );
}
