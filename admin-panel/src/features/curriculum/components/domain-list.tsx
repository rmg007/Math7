import { Link } from 'react-router-dom'
import { Plus, Book, Search, Filter, Square, CheckSquare, GripVertical, Pencil, Trash2, X } from 'lucide-react'
import { usePaginatedDomains, useDeleteDomain, useBulkDeleteDomains, useUpdateDomainOrder, useBulkCreateDomains, useBulkUpdateDomainsStatus } from '../hooks/use-domains'
import { DataToolbar } from '@/components/ui/data-toolbar'
import type { DataColumn } from '@/lib/data-utils';
import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useToast } from '@/hooks/use-toast';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { Pagination } from '@/components/ui/pagination'
import { SortableHeader } from '@/components/ui/sortable-header'
import { EmptyState } from '@/components/ui/empty-state'
import { AdminHeader } from '@/components/ui/admin-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils'
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

import type { Tables } from '@/lib/database.types'

const DEFAULT_PAGE_SIZE = 10

type Domain = Tables<'domains'>

const DOMAIN_COLUMNS: DataColumn[] = [
    { key: 'title', header: 'Title' },
    { key: 'slug', header: 'Slug' },
    { key: 'description', header: 'Description' },
    { key: 'sort_order', header: 'Sort Order' },
    { key: 'status', header: 'Status' },
];

interface SortableRowProps {
  domain: Domain
  isSelected: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  renderStatusBadge: (status: string) => JSX.Element
  isDragDisabled: boolean
}

const SortableRow = memo(({ domain, isSelected, onSelect, onDelete, renderStatusBadge, isDragDisabled }: SortableRowProps) => {
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
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-indigo-50/30 transition-all group/row border-b border-gray-50 last:border-0 relative">
      <td className="pl-6 pr-2 py-4 w-12 relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1 bg-indigo-600 opacity-0 group-hover/row:opacity-100 transition-opacity" />
        {!isDragDisabled ? (
          <button
            {...attributes}
            {...listeners}
            className="p-2 text-indigo-400/50 hover:text-indigo-600 cursor-grab active:cursor-grabbing touch-none transition-colors"
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
        <button onClick={() => onSelect(domain.domain_id)} aria-label={isSelected ? 'Deselect domain' : 'Select domain'} className="text-gray-300 hover:text-indigo-600 transition-colors">
          {isSelected ? <CheckSquare className="h-5 w-5 text-indigo-600" /> : <Square className="h-5 w-5" />}
        </button>
      </td>
      <td className="px-4 py-4 min-w-[300px]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover/row:scale-110 transition-transform shadow-sm">
            <Book className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
               <span className="font-black text-gray-900 text-sm tracking-tight leading-none group-hover/row:text-indigo-700 transition-colors">{domain.title}</span>
               <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.1em] mt-1.5 italic">ID: {domain.domain_id.substring(0, 8)}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-gray-100 text-gray-600 font-bold text-xs border border-gray-200 shadow-sm">
          {domain.sort_order ?? 0}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-col">
            <span className="text-xs font-black text-gray-900 tracking-tight italic">
                {new Date(domain.updated_at).toLocaleDateString()}
            </span>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-0.5">
                {new Date(domain.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
      </td>
      <td className="px-4 py-4">
        {renderStatusBadge(domain.status || 'draft')}
      </td>
      <td className="pl-4 pr-8 py-3 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
          <Link
            to={`/domains/${domain.domain_id}/edit`}
            className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Edit Domain"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => onDelete(domain.domain_id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Delete Domain"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
});

const SortableCard = memo(({ domain, isSelected, onSelect, onDelete, renderStatusBadge, isDragDisabled }: SortableRowProps) => {
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
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white/80 backdrop-blur-xl rounded-3xl border transition-all duration-300 group/card",
        isSelected ? 'border-indigo-400 bg-indigo-50/50 shadow-md shadow-indigo-500/10' : 'border-white/40 hover:border-indigo-200 hover:shadow-lg'
      )}
    >
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {!isDragDisabled ? (
              <button
                {...attributes}
                {...listeners}
                className="p-2 text-indigo-300 hover:text-indigo-600 cursor-grab active:cursor-grabbing touch-none transition-colors"
                aria-label="Drag to reorder"
              >
                <GripVertical className="h-5 w-5" />
              </button>
            ) : (
              <div className="p-2 text-gray-200">
                <GripVertical className="h-5 w-5" />
              </div>
            )}
            <button
              onClick={() => onSelect(domain.domain_id)}
              aria-label={isSelected ? 'Deselect domain' : 'Select domain'}
              className="p-2 text-gray-300 hover:text-indigo-600 transition-colors"
            >
              {isSelected ? <CheckSquare className="h-5 w-5 text-indigo-600" /> : <Square className="h-5 w-5" />}
            </button>
          </div>
          <div className="flex gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <Link
              to={`/domains/${domain.domain_id}/edit`}
              className="p-2.5 rounded-xl bg-white border border-gray-100 text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              onClick={() => onDelete(domain.domain_id)}
              className="p-2.5 rounded-xl bg-white border border-gray-100 text-red-500 hover:bg-red-50 transition-all shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-sm transition-transform group-hover/card:scale-110">
            <Book className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-gray-900 text-lg tracking-tight truncate leading-tight mb-1">{domain.title}</h3>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">ID: {domain.domain_id.substring(0, 8)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div className="flex items-center gap-3">
            <span className="h-7 px-2.5 flex items-center justify-center rounded-lg bg-gray-100 border border-gray-200 text-[10px] font-black text-gray-500 tracking-widest">
              RANK {domain.sort_order ?? 0}
            </span>
            {renderStatusBadge(domain.status || 'draft')}
          </div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
            MOD: {new Date(domain.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  )
});

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
  const bulkCreate = useBulkCreateDomains()
  const bulkUpdateStatus = useBulkUpdateDomainsStatus()
  const { toast } = useToast()

  const showToast = useCallback((title: string, type: 'success' | 'error' = 'success') => {
    toast({
      title,
      variant: type === 'error' ? 'destructive' : 'default',
    })
  }, [toast])

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

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === domains.length && domains.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(domains.map(d => d.domain_id)))
    }
  }, [domains, selectedIds.size])

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleMarkLive = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status: 'live' });
      showToast(`${selectedIds.size} domain(s) marked as live`, 'success');
      setSelectedIds(new Set());
    } catch {
      showToast('Failed to update domains', 'error');
    }
  };

  const handleMarkDraft = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status: 'draft' });
      showToast(`${selectedIds.size} domain(s) marked as draft`, 'success');
      setSelectedIds(new Set());
    } catch {
      showToast('Failed to update domains', 'error');
    }
  };

  const handleMarkPublished = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status: 'published' });
      showToast(`${selectedIds.size} domain(s) marked as published`, 'success');
      setSelectedIds(new Set());
    } catch {
      showToast('Failed to update domains', 'error');
    }
  };


  const handleDelete = useCallback((id: string) => {
    setDeleteConfirmation({ type: 'single', id })
  }, [])

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

  const handleImport = async (data: Partial<Domain>[]) => {
    try {
      await bulkCreate.mutateAsync(data);
      showToast(`${data.length} domains imported successfully`, 'success');
    } catch {
      showToast('Failed to import domains. Check for duplicate slugs.', 'error');
    }
  };

    const renderStatusBadge = useCallback((status: string) => {
        return (
            <StatusBadge 
                status={status.toLowerCase() as StatusType} 
                label={status.toUpperCase()}
            />
        );
    }, []);

  if (isLoading) {
    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <AdminHeader 
          title="Curriculum Domains"
          description="Configure and organize the high-level educational areas for your curriculum."
          icon={Book}
          breadcrumbs={[
            { label: 'Curriculum', href: '/domains' },
            { label: 'Domains', href: '/domains' }
          ]}
        />
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/20 p-8 space-y-4">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-2xl p-8 text-center">
        <p className="text-red-700 font-bold">Error loading domains. Please check your connection and try again.</p>
      </div>
    )
  }

  const isAllSelected = domains.length ? selectedIds.size === domains.length : false

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminHeader 
        title="Curriculum Domains"
        description="Configure and organize the high-level educational areas for your curriculum."
        icon={Book}
        breadcrumbs={[
          { label: 'Curriculum', href: '/domains' },
          { label: 'Domains', href: '/domains' }
        ]}
        actions={
          <div className="flex items-center gap-3">
             <DataToolbar 
                data={domains as Record<string, unknown>[]}
                columns={DOMAIN_COLUMNS}
                entityName="Domains"
                onImport={handleImport}
                importDisabled={false}
             />
             <Link to="/domains/new">
                <Button className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 gap-2">
                  <Plus className="h-4 w-4" />
                  <span>New Domain</span>
                </Button>
            </Link>
          </div>
        }
      />

      {/* Premium Filter Bar */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/20 p-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search domains by title or identifier code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-100 bg-white/50 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-medium"
          />
          {searchQuery && (
            <button
              onClick={clearFilters}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
             <Filter className="h-3.5 w-3.5 text-indigo-700" />
             <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mr-2">Status:</span>
             <Select
               value={statusFilter}
               onValueChange={(v) => setStatusFilter(v as 'all' | 'draft' | 'published' | 'live')}
             >
                <SelectTrigger aria-label="Filter by status" className="w-auto h-6 border-none bg-transparent p-0 focus:ring-0 shadow-none text-xs font-black text-indigo-700 hover:text-indigo-600 transition-colors uppercase tracking-tight">
                 <SelectValue placeholder="All Status" />
               </SelectTrigger>
               <SelectContent className="rounded-2xl border-white/20 backdrop-blur-xl bg-white/90">
                 <SelectItem value="all">ALL STATUS</SelectItem>
                 <SelectItem value="draft">DRAFT</SelectItem>
                 <SelectItem value="published">PUBLISHED</SelectItem>
                 <SelectItem value="live">LIVE</SelectItem>
               </SelectContent>
             </Select>
          </div>

          <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/10 rounded-xl flex items-center gap-2">
             <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Registry:</span>
             <span className="text-sm font-black text-indigo-700 tracking-tight">{totalCount} MAPPED</span>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-600/20 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4 pl-4">
            <span className="text-white font-black text-xs uppercase tracking-[0.2em]">{selectedIds.size} SELECTED FOR BATCH PROCESSING</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkPublished}
              className="h-10 px-4 rounded-xl text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10"
            >
              Publish
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkLive}
              className="h-10 px-4 rounded-xl text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10"
            >
              Go Live
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkDraft}
              className="h-10 px-4 rounded-xl text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10"
            >
              Draft
            </Button>
            <div className="w-px h-6 bg-white/20 mx-2" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmation({ type: 'bulk' })}
              className="h-10 px-4 rounded-xl text-red-200 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Purge
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/20 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b-2 border-gray-100">
                <tr>
                  <th className="w-12 h-14 pl-6 pr-2 font-black text-[10px] uppercase tracking-widest text-gray-600"></th>
                  <th className="w-12 h-14 px-4">
                    <button onClick={handleSelectAll} aria-label={isAllSelected ? 'Deselect all domains' : 'Select all domains'} className="text-gray-300 hover:text-indigo-600 transition-colors">
                      {isAllSelected && domains.length > 0 ? <CheckSquare className="h-5 w-5 text-indigo-600" /> : <Square className="h-5 w-5" />}
                    </button>
                  </th>
                  <th className="h-14 px-4 text-left font-black text-[10px] uppercase tracking-widest text-gray-600">
                    <SortableHeader
                        label="Identity & Domain"
                        column="title"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                        className="text-[10px]"
                    />
                  </th>
                  <th className="h-14 px-4 text-center font-black text-[10px] uppercase tracking-widest text-gray-600">
                    <SortableHeader
                        label="Rank"
                        column="sort_order"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                        className="text-[10px] justify-center"
                    />
                  </th>
                  <th className="h-14 px-4 text-left font-black text-[10px] uppercase tracking-widest text-gray-600">
                    <SortableHeader
                      label="Timestamp"
                      column="updated_at"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      className="text-[10px]"
                    />
                  </th>
                  <th className="h-14 px-4 text-left font-black text-[10px] uppercase tracking-widest text-gray-600">Protocol Status</th>
                  <th className="h-14 pl-4 pr-8 text-right font-black text-[10px] uppercase tracking-widest text-gray-600">Execution</th>
                </tr>
              </thead>
              <SortableContext items={domainIds} strategy={verticalListSortingStrategy}>
                <tbody className="divide-y divide-gray-50">
                  {!domains.length ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-24">
                        <EmptyState
                          icon={Book}
                          title={hasActiveFilters ? 'No matches found' : 'No domains yet'}
                          description={hasActiveFilters ? 'Try adjusting your search or filters to find what you are looking for.' : 'Get started by creating your first domain to organize your curriculum.'}
                          action={
                            hasActiveFilters ? {
                              label: "Clear filters",
                              onClick: clearFilters
                            } : {
                              label: "Create Domain",
                              onClick: () => (window.location.href = "/domains/new")
                            }
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
          <div className="md:hidden p-4">
            <SortableContext items={domainIds} strategy={verticalListSortingStrategy}>
              {!domains.length ? (
                <div className="rounded-[2rem] border border-dashed border-gray-200 p-12 bg-white/30 backdrop-blur-md">
                  <EmptyState
                    icon={Book}
                    title={hasActiveFilters ? 'No matches found' : 'No domains yet'}
                    description={hasActiveFilters ? 'Try adjusting your search or filters.' : 'Get started by creating your first domain.'}
                    action={
                      hasActiveFilters ? {
                        label: "Clear filters",
                        onClick: clearFilters
                      } : {
                        label: "Create Domain",
                        onClick: () => (window.location.href = "/domains/new")
                      }
                    }
                  />
                </div>
              ) : (
                <div className="space-y-4">
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

        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100">
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

      <AlertDialog open={Boolean(deleteConfirmation)} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-none bg-white/90 backdrop-blur-2xl p-10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-gray-900 tracking-tight italic">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 font-medium">
              {deleteConfirmation?.type === 'bulk' 
                ? `This will permanently purge ${selectedIds.size} selected domain(s). This action is irreversible.` 
                : "This action cannot be undone. This will permanently delete the domain and remove all associated curriculum data from our high-availability clusters."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-12 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:bg-gray-100 italic transition-all border-none">Abort</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="h-12 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all hover:-translate-y-0.5"
            >
              Confirm Execution
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
