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
import { CheckCircle2, Circle, CheckSquare, Layers, Layout, Plus, Square } from 'lucide-react';

import { AppCard } from '../components/apps/app-card';
import { AppRow } from '../components/apps/app-row';
import { AppModals } from '../components/apps/app-modals';
import { APP_COLUMNS } from '../components/apps/schema';
import { useAppsState } from '../hooks/use-apps-state';
import { SearchToolbar, FilterToolbar, StatusFilter } from '../components/platform-toolbar';

export function AppsPage() {
  const {
    appsLoading,
    subjects,
    createApp,
    updateApp,
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
    editingApp,
    deleteConfirmation,
    setDeleteConfirmation,
    form,
    handleOpenDialog,
    filteredApps,
    paginatedApps,
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
  } = useAppsState();

  return (
    <>
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onDelete={handleBulkDelete}
        actions={[
          {
            label: 'Activate',
            onClick: () => handleBulkStatusUpdate(true),
            icon: <CheckCircle2 className="h-3.5 w-3.5" />,
            className: 'text-emerald-400 hover:bg-emerald-500/10',
          },
          {
            label: 'Deactivate',
            onClick: () => handleBulkStatusUpdate(false),
            icon: <Circle className="h-3.5 w-3.5" />,
            className: 'text-slate-400 hover:bg-slate-500/10',
          },
        ]}
      />

      <div
        className="max-w-7xl mx-auto space-y-4 p-4 md:p-6"
        data-testid="apps-page"
        data-hydration-complete={!appsLoading}
      >
        <AdminHeader
          title="Applications"
          description="Manage educational apps and their customized instances."
          icon={Layout}
          className="mb-2"
          actions={
            <Button
              onClick={() => handleOpenDialog()}
              className="h-9 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Application
            </Button>
          }
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6 p-2">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-2">
            <SearchToolbar
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
              }}
              count={filteredApps.length}
              countLabel="Pool"
              className="flex-1"
            />

            <FilterToolbar>
              <StatusFilter
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { label: 'All Status', value: 'all' },
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                ]}
              />

              <ColumnToggle
                columns={APP_COLUMNS}
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
                data={[]}
                columns={APP_COLUMNS}
                entityName="Applications"
                onImport={handleImport}
              />
            </FilterToolbar>
          </div>
        </div>

        <div
          className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden"
          data-testid="apps-list-container"
        >
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
                  {visibleColumns.has('display_name') && (
                    <TableHead className="px-4">
                      <SortableHeader
                        label="Name"
                        column="display_name"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has('subject') && (
                    <TableHead>
                      <SortableHeader
                        label="Subject"
                        column="subject"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has('subdomain') && (
                    <TableHead>
                      <SortableHeader
                        label="Subdomain"
                        column="subdomain"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has('grade_level') && (
                    <TableHead className="hidden md:table-cell">
                      <SortableHeader
                        label="Grade"
                        column="grade_level"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has('is_active') && (
                    <TableHead>
                      <SortableHeader
                        label="Status"
                        column="is_active"
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
                {appsLoading ? (
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
                        <div className="h-3.5 bg-gray-200 rounded w-32 animate-pulse"></div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="h-3.5 bg-gray-200 rounded w-12 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded-full w-14 animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex gap-0.5 justify-end">
                          <div className="h-7 w-7 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-7 w-7 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedApps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-20">
                      <EmptyState
                        icon={Layers}
                        title={searchQuery ? 'No matches found' : 'No applications yet'}
                        description={
                          searchQuery
                            ? `No applications match "${searchQuery}".`
                            : 'Create your first application to get started.'
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
                              New Application
                            </Button>
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedApps.map((app) => (
                    <AppRow
                      key={app.app_id}
                      app={app}
                      isSelected={selectedIds.has(app.app_id)}
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
            {appsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : paginatedApps.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={Layers}
                  title={searchQuery ? 'No matches found' : 'No applications yet'}
                  description={
                    searchQuery
                      ? `No applications match "${searchQuery}".`
                      : 'Create your first application to get started.'
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
                        New Application
                      </Button>
                    )
                  }
                />
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedApps.map((app) => (
                  <AppCard
                    key={app.app_id}
                    app={app}
                    isSelected={selectedIds.has(app.app_id)}
                    onSelect={handleSelectOne}
                    onEdit={handleOpenDialog}
                    onDelete={handleDelete}
                    visibleColumns={visibleColumns}
                  />
                ))}
              </div>
            )}
          </div>

          {filteredApps.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredApps.length / pageSize)}
                totalCount={filteredApps.length}
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

        <AppModals
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          deleteConfirmation={deleteConfirmation}
          setDeleteConfirmation={setDeleteConfirmation}
          editingApp={editingApp}
          subjects={subjects}
          form={form}
          onSubmit={onSubmit}
          selectedCount={selectedIds.size}
          isPending={createApp.isPending || updateApp.isPending}
          confirmBulkDelete={confirmBulkDelete}
          confirmSingleDelete={confirmSingleDelete}
        />
      </div>
    </>
  );
}
