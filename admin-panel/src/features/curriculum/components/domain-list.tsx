import { Link } from 'react-router-dom'
import { Plus, CheckSquare, Square, Search, X, Book, GripVertical, Pencil, Trash2, ChevronRight, Filter } from 'lucide-react'
import { usePaginatedDomains, useDeleteDomain, useBulkDeleteDomains, useUpdateDomainOrder } from '../hooks/use-domains'
import { useState, useEffect, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast';
import { Pagination } from '@/components/ui/pagination'
import { SortableHeader } from '@/components/ui/sortable-header'
import { EmptyState } from '@/components/ui/empty-state'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"



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
  domain_id: string
  title: string
  slug: string
  sort_order: number | null
  status: 'draft' | 'published' | 'live' | null
  updated_at: string
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
  } = useSortable({ id: domain.domain_id, disabled: isDragDisabled })

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
            className="p-2 text-gray-500 hover:text-gray-700 cursor-grab active:cursor-grabbing touch-none"
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
      <td className="px-4 py-3">
        <button onClick={() => onSelect(domain.domain_id)} className="text-gray-400 hover:text-gray-600">
          {isSelected ? <CheckSquare className="h-5 w-5 text-purple-600" /> : <Square className="h-5 w-5" />}
        </button>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-50 text-blue-700 font-bold text-sm">
          {domain.sort_order ?? 0}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
             <span className="font-bold text-gray-900 text-sm tracking-tight">{domain.title}</span>
             <span className="text-[10px] text-gray-400 font-mono tracking-wide uppercase">ID: {domain.domain_id.substring(0, 8)}...</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
            <span className="text-sm text-gray-900">
                {new Date(domain.updated_at).toLocaleDateString()}
            </span>
            <span className="text-xs text-gray-500">
                {new Date(domain.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
      </td>
      <td className="px-6 py-4">
        {renderStatusBadge(domain.status || 'draft')}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/domains/${domain.domain_id}/edit`}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Edit Domain"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => onDelete(domain.domain_id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Delete Domain"
          >
            <Trash2 className="h-4 w-4" />
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
  } = useSortable({ id: domain.domain_id, disabled: isDragDisabled })

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
          onClick={() => onSelect(domain.domain_id)}
          className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          {isSelected ? <CheckSquare className="h-5 w-5 text-purple-600" /> : <Square className="h-5 w-5" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-semibold text-xs flex-shrink-0">
              {domain.sort_order ?? 0}
            </span>
            <h3 className="font-medium text-gray-900 truncate">{domain.title}</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Modified: {new Date(domain.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          {renderStatusBadge(domain.status || 'draft')}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
        <Link
          to={`/domains/${domain.domain_id}/edit`}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </Link>
        <button
          onClick={() => onDelete(domain.domain_id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
        >
          <Trash2 className="h-4 w-4" />
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
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'single' | 'bulk', id?: string } | null>(null)

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
  const updateDomainOrder = useUpdateDomainOrder()
  const { toast } = useToast()

  const showToast = (title: string, type: 'success' | 'error' = 'success') => {
    toast({
      title,
      variant: type === 'error' ? 'destructive' : 'default',
    })
  }

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

  const domains = useMemo(() => paginatedData?.data ?? [], [paginatedData])
  const totalCount = paginatedData?.totalCount ?? 0
  const totalPages = paginatedData?.totalPages ?? 1

  const domainIds = useMemo(() => domains.map(d => d.domain_id), [domains])

  const isDragDisabled = Boolean(debouncedSearch) || statusFilter !== 'all' || sortBy !== 'sort_order'

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = domains.findIndex(d => d.domain_id === active.id)
      const newIndex = domains.findIndex(d => d.domain_id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedDomains = arrayMove(domains, oldIndex, newIndex)

        const updates = reorderedDomains.map((domain, index) => ({
          domain_id: domain.domain_id,
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
      setSelectedIds(new Set(domains.map(d => d.domain_id)))
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



  const handleDelete = (id: string) => {
    setDeleteConfirmation({ type: 'single', id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirmation) return

    try {
      if (deleteConfirmation.type === 'bulk') {
        await bulkDelete.mutateAsync(Array.from(selectedIds))
        showToast(`${selectedIds.size} domain(s) deleted`, 'success')
        setSelectedIds(new Set())
      } else if (deleteConfirmation.type === 'single' && deleteConfirmation.id) {
        await deleteDomain.mutateAsync(deleteConfirmation.id)
        showToast('Domain deleted', 'success')
      }
    } catch {
      showToast('Failed to delete domain(s)', 'error')
    } finally {
      setDeleteConfirmation(null)
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
    const statusMapping = {
      live: { label: 'LIVE', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      published: { label: 'PUBLISHED', className: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      draft: { label: 'DRAFT', className: 'bg-orange-50 text-orange-600 border-orange-100' },
      default: { label: 'UNKNOWN', className: 'bg-gray-100 text-gray-600 border-gray-200' }
    };

    const config = statusMapping[status as keyof typeof statusMapping] || statusMapping.default;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${config.className}`}>
        {config.label}
      </span>
    )
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
    <div className="space-y-6">
      {/* Breadcrumbs & Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
          <span>Curriculum</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-purple-600">Domains</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Curriculum Domains</h2>
            <p className="text-gray-500 mt-1 text-sm md:text-base">Configure and organize the high-level educational areas.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex bg-gray-100 p-1 rounded-lg">
                <button className="px-4 py-1.5 text-sm font-medium bg-white shadow-sm rounded-md text-gray-900">Active</button>
                <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900">Archived</button>
             </div>
             <Link
              to="/domains/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>New Domain</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
             <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by domain title or unique ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50/50 text-gray-700 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all placeholder:text-gray-400"
              />
            </div>
            
             <div className="flex items-center gap-3 w-full md:w-auto">
               <div className="relative w-full md:w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'published' | 'live')}
                    className="w-full appearance-none pl-4 pr-10 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="live">Live</option>
                  </select>
                  <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
               </div>
            </div>
        </div>

        <div className="p-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {/* Desktop Table View */}
                  <div className="hidden md:block overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="text-left px-4 py-3 w-10">
                    <span className="sr-only">Drag handle</span>
                  </th>
                  <th className="text-left px-4 py-3 w-10">
                    <button onClick={handleSelectAll} className="text-gray-400 hover:text-gray-600">
                      {isAllSelected && domains.length > 0 ? <CheckSquare className="h-5 w-5 text-purple-600" /> : <Square className="h-5 w-5" />}
                    </button>
                  </th>
                  <th className="text-left px-6 py-3">
                    <SortableHeader
                        label="ORD."
                        column="sort_order"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                        className="text-xs font-bold text-gray-400 uppercase tracking-wider"
                    />
                  </th>
                  <th className="text-left px-6 py-3">
                    <SortableHeader
                      label="DOMAIN TITLE & ID"
                      column="title"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      className="text-xs font-bold text-gray-400 uppercase tracking-wider"
                    />
                  </th>
                  <th className="text-left px-6 py-3">
                    <SortableHeader
                      label="MODIFIED"
                      column="updated_at"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      className="text-xs font-bold text-gray-400 uppercase tracking-wider"
                    />
                  </th>
                  <th className="text-left px-6 py-3">
                    <SortableHeader
                      label="STATUS"
                      column="status"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      className="text-xs font-bold text-gray-400 uppercase tracking-wider"
                    />
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <SortableContext items={domainIds} strategy={verticalListSortingStrategy}>
                <tbody className="divide-y divide-gray-50">
                  {!domains.length ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12">
                        <EmptyState
                          icon={Book}
                          title={hasActiveFilters ? 'No matches found' : 'No domains yet'}
                          description={hasActiveFilters ? 'Try adjusting your search or filters to find what you are looking for.' : 'Get started by creating your first domain to organize your curriculum.'}
                          action={
                            hasActiveFilters ? (
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
                            )
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    domains.map((domain) => (
                      <SortableRow
                        key={domain.domain_id}
                        domain={domain}
                        isSelected={selectedIds.has(domain.domain_id)}
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
                <div className="rounded-xl border border-gray-100 p-8">
                  <EmptyState
                    icon={Book}
                    title={hasActiveFilters ? 'No matches found' : 'No domains yet'}
                    description={hasActiveFilters ? 'Try adjusting your search or filters.' : 'Get started by creating your first domain.'}
                    action={
                      hasActiveFilters ? (
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
                      )
                    }
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {domains.map((domain) => (
                    <SortableCard
                      key={domain.domain_id}
                      domain={domain}
                      isSelected={selectedIds.has(domain.domain_id)}
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
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <AlertDialog open={Boolean(deleteConfirmation)} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmation?.type === 'bulk' 
                ? `This will permanently delete ${selectedIds.size} selected domain(s).` 
                : "This action cannot be undone. This will permanently delete the domain and remove it from our servers."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
