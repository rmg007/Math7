/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from 'react-router-dom'
import { Plus, CheckSquare, Square, Search, X, Trash, Book, GripVertical } from 'lucide-react'
import { usePaginatedDomains, useDeleteDomain, useBulkDeleteDomains, useBulkUpdateDomainsStatus, useUpdateDomainOrder } from '../hooks/use-domains'
import { useState, useEffect, useMemo } from 'react'
import { useToast } from '@/components/ui/toast'
import { Pagination } from '@/components/ui/pagination'
import { SortableHeader } from '@/components/ui/sortable-header'
import { DataToolbar } from '@/components/ui/data-toolbar'
import type { DataColumn } from '@/lib/data-utils'

const DOMAIN_COLUMNS: DataColumn[] = [
  { key: 'title', header: 'title' },
  { key: 'slug', header: 'slug' },
  { key: 'sort_order', header: 'sort_order' },
  { key: 'status', header: 'status' },
]
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const DEFAULT_PAGE_SIZE = 10

interface Domain {
  id: string
  title: string
  slug: string
  sort_order: number
  status?: string
}

interface SortableRowProps {
  domain: Domain
  isSelected: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  renderStatusBadge: (status: string) => JSX.Element
  isDragDisabled: boolean
}

function SortableRow({ domain, isSelected, onSelect, onDelete, renderStatusBadge, isDragDisabled }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: domain.id, disabled: isDragDisabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? '0 4px 12px rgba(0, 0, 0, 0.15)' : undefined,
    backgroundColor: isDragging ? '#f9fafb' : undefined,
    position: 'relative' as const,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-gray-50 transition-colors">
      <td className="px-2 py-4 w-10">
        {!isDragDisabled ? (
          <button
            {...attributes}
            {...listeners}
            className="p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-5 w-5" />
          </button>
        ) : (
          <div className="p-2 text-gray-200">
            <GripVertical className="h-5 w-5" />
          </div>
        )}
      </td>
      <td className="px-4 py-4">
        <button onClick={() => onSelect(domain.id)} className="text-gray-400 hover:text-gray-600">
          {isSelected ? <CheckSquare className="h-5 w-5 text-purple-600" /> : <Square className="h-5 w-5" />}
        </button>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-semibold text-sm">
          {domain.sort_order}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="font-medium text-gray-900">{domain.title}</span>
      </td>
      <td className="px-6 py-4">
        <code className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600">{domain.slug}</code>
      </td>
      <td className="px-6 py-4">
        {renderStatusBadge((domain as any).status || 'draft')}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/domains/${domain.id}/edit`}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={() => onDelete(domain.id)}
            className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}

function SortableCard({ domain, isSelected, onSelect, onDelete, renderStatusBadge, isDragDisabled }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: domain.id, disabled: isDragDisabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? '0 8px 16px rgba(0, 0, 0, 0.15)' : undefined,
    position: 'relative' as const,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border ${isSelected ? 'border-purple-300 bg-purple-50' : 'border-gray-200'} p-4 space-y-3 transition-colors`}
    >
      <div className="flex items-start gap-3">
        {!isDragDisabled ? (
          <button
            {...attributes}
            {...listeners}
            className="p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-5 w-5" />
          </button>
        ) : (
          <div className="p-2 text-gray-200 flex-shrink-0">
            <GripVertical className="h-5 w-5" />
          </div>
        )}
        <button
          onClick={() => onSelect(domain.id)}
          className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          {isSelected ? <CheckSquare className="h-5 w-5 text-purple-600" /> : <Square className="h-5 w-5" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-semibold text-xs flex-shrink-0">
              {domain.sort_order}
            </span>
            <h3 className="font-medium text-gray-900 truncate">{domain.title}</h3>
          </div>
          <code className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{domain.slug}</code>
        </div>
        <div className="flex-shrink-0">
          {renderStatusBadge((domain as any).status || 'draft')}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
        <Link
          to={`/domains/${domain.id}/edit`}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete(domain.id)}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export function DomainList() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'live'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [sortBy, setSortBy] = useState<string>('sort_order')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const { data: paginatedData, isLoading, error } = usePaginatedDomains({
    page,
    pageSize,
    search: debouncedSearch,
    status: statusFilter,
    sortBy,
    sortOrder,
  })

  const deleteDomain = useDeleteDomain()
  const bulkDelete = useBulkDeleteDomains()
  const bulkUpdateStatus = useBulkUpdateDomainsStatus()
  const updateDomainOrder = useUpdateDomainOrder()
  const { showToast } = useToast()

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
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setSelectedIds(new Set())
    setPage(1)
  }, [statusFilter])

  const domains = paginatedData?.data ?? []
  const totalCount = paginatedData?.totalCount ?? 0
  const totalPages = paginatedData?.totalPages ?? 1

  const domainIds = useMemo(() => domains.map(d => d.id), [domains])

  const isDragDisabled = Boolean(debouncedSearch) || statusFilter !== 'all' || sortBy !== 'sort_order'

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = domains.findIndex(d => d.id === active.id)
      const newIndex = domains.findIndex(d => d.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedDomains = arrayMove(domains, oldIndex, newIndex)
        
        const updates = reorderedDomains.map((domain, index) => ({
          id: domain.id,
          sort_order: index + 1 + (page - 1) * pageSize,
        }))

        try {
          await updateDomainOrder.mutateAsync(updates)
          showToast('Domain order updated', 'success')
        } catch {
          showToast('Failed to update domain order', 'error')
        }
      }
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === domains.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(domains.map(d => d.id)))
    }
  }

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (confirm(`Are you sure you want to delete ${selectedIds.size} domain(s)?`)) {
      try {
        await bulkDelete.mutateAsync(Array.from(selectedIds))
        showToast(`${selectedIds.size} domain(s) deleted`, 'success')
        setSelectedIds(new Set())
      } catch {
        showToast('Failed to delete domains', 'error')
      }
    }
  }

  const handleMarkLive = async () => {
    if (selectedIds.size === 0) return
    try {
      await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status: 'live' })
      showToast(`${selectedIds.size} domain(s) marked as live`, 'success')
      setSelectedIds(new Set())
    } catch {
      showToast('Failed to update domains', 'error')
    }
  }

  const handleMarkDraft = async () => {
    if (selectedIds.size === 0) return
    try {
      await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status: 'draft' })
      showToast(`${selectedIds.size} domain(s) marked as draft`, 'success')
      setSelectedIds(new Set())
    } catch {
      showToast('Failed to update domains', 'error')
    }
  }

  const handleMarkPublished = async () => {
    if (selectedIds.size === 0) return
    try {
      await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status: 'published' })
      showToast(`${selectedIds.size} domain(s) marked as published (ready for release)`, 'success')
      setSelectedIds(new Set())
    } catch {
      showToast('Failed to update domains', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this domain?')) {
      try {
        await deleteDomain.mutateAsync(id)
        showToast('Domain deleted', 'success')
      } catch {
        showToast('Failed to delete domain', 'error')
      }
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    setSelectedIds(new Set())
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
    setSelectedIds(new Set())
  }

  const hasActiveFilters = searchQuery || statusFilter !== 'all'

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPage(1)
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Live
          </span>
        )
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Published
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Draft
          </span>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-500">Loading domains...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-600">Error loading domains. Please try again.</p>
      </div>
    )
  }

  const isAllSelected = domains.length ? selectedIds.size === domains.length : false

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Domains</h2>
          <p className="mt-1 text-sm md:text-base text-gray-500">Manage curriculum domains</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <DataToolbar
            data={domains as any[]}
            columns={DOMAIN_COLUMNS}
            entityName="Domains"
            importDisabled={true}
            importDisabledMessage="Domain import is not available. Please create domains manually."
          />
          <Link
            to="/domains/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto"
          >
            <Plus className="h-5 w-5" />
            <span>New Domain</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-4">
        <div className="space-y-3 md:space-y-4 mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search domains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 min-h-[48px] rounded-lg border border-gray-200 bg-white text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors text-base"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-1 px-4 py-3 min-h-[48px] text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Clear filters</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 w-full sm:w-auto">
              <label className="text-sm font-medium text-gray-600">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'published' | 'live')}
                className="px-3 py-3 min-h-[48px] rounded-lg border border-gray-200 bg-white text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors text-base w-full sm:w-auto"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="live">Live</option>
              </select>
            </div>

            {isDragDisabled && sortBy === 'sort_order' && (
              <span className="text-xs md:text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                Clear filters to enable drag reordering
              </span>
            )}

            {selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <span className="text-sm text-gray-600 w-full sm:w-auto">{selectedIds.size} selected</span>
                <button
                  onClick={handleMarkPublished}
                  disabled={bulkUpdateStatus.isPending}
                  className="inline-flex items-center justify-center gap-1 px-4 py-3 min-h-[48px] text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors flex-1 sm:flex-none"
                >
                  Mark Published
                </button>
                <button
                  onClick={handleMarkLive}
                  disabled={bulkUpdateStatus.isPending}
                  className="inline-flex items-center justify-center gap-1 px-4 py-3 min-h-[48px] text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors flex-1 sm:flex-none"
                >
                  Mark Live
                </button>
                <button
                  onClick={handleMarkDraft}
                  disabled={bulkUpdateStatus.isPending}
                  className="inline-flex items-center justify-center gap-1 px-4 py-3 min-h-[48px] text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-1 sm:flex-none"
                >
                  Mark Draft
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDelete.isPending}
                  className="inline-flex items-center justify-center gap-1 px-4 py-3 min-h-[48px] text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex-1 sm:flex-none"
                >
                  <Trash className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* @ts-expect-error - React types version mismatch with @dnd-kit */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-2 py-4 w-10">
                    <span className="sr-only">Drag handle</span>
                  </th>
                  <th className="text-left px-4 py-4 w-10">
                    <button onClick={handleSelectAll} className="text-gray-400 hover:text-gray-600">
                      {isAllSelected && domains.length > 0 ? <CheckSquare className="h-5 w-5 text-purple-600" /> : <Square className="h-5 w-5" />}
                    </button>
                  </th>
                  <th className="text-left px-6 py-4">
                    <SortableHeader
                      label="Order"
                      column="sort_order"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="text-left px-6 py-4">
                    <SortableHeader
                      label="Title"
                      column="title"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="text-left px-6 py-4">
                    <SortableHeader
                      label="Slug"
                      column="slug"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="text-left px-6 py-4">
                    <SortableHeader
                      label="Status"
                      column="status"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <SortableContext items={domainIds} strategy={verticalListSortingStrategy}>
                <tbody className="divide-y divide-gray-100">
                  {!domains.length ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <Book className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 mb-4">
                            {hasActiveFilters ? 'No domains match your filters.' : 'No domains found. Create one to get started.'}
                          </p>
                          {hasActiveFilters ? (
                            <button
                              onClick={clearFilters}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                            >
                              <X className="h-4 w-4" />
                              Clear filters
                            </button>
                          ) : (
                            <Link
                              to="/domains/new"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                              Create Domain
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    domains.map((domain) => (
                      <SortableRow
                        key={domain.id}
                        domain={domain}
                        isSelected={selectedIds.has(domain.id)}
                        onSelect={handleSelectOne}
                        onDelete={handleDelete}
                        renderStatusBadge={renderStatusBadge}
                        isDragDisabled={isDragDisabled}
                      />
                    ))
                  )}
                </tbody>
              </SortableContext>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            <SortableContext items={domainIds} strategy={verticalListSortingStrategy}>
              {!domains.length ? (
                <div className="rounded-xl border border-gray-100 p-8 text-center">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                      <Book className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">
                      {hasActiveFilters ? 'No domains match your filters.' : 'No domains found. Create one to get started.'}
                    </p>
                    {hasActiveFilters ? (
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                        Clear filters
                      </button>
                    ) : (
                      <Link
                        to="/domains/new"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Create Domain
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {domains.map((domain) => (
                    <SortableCard
                      key={domain.id}
                      domain={domain}
                      isSelected={selectedIds.has(domain.id)}
                      onSelect={handleSelectOne}
                      onDelete={handleDelete}
                      renderStatusBadge={renderStatusBadge}
                      isDragDisabled={isDragDisabled}
                    />
                  ))}
                </div>
              )}
            </SortableContext>
          </div>
        </DndContext>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  )
}
