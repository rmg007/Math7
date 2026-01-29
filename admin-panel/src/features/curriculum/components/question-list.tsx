/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from 'react-router-dom';
import { usePaginatedQuestions, useDeleteQuestion, useBulkDeleteQuestions, useBulkUpdateQuestionsStatus, useDuplicateQuestion } from '../hooks/use-questions';
import { useSkills } from '../hooks/use-skills';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';
import { SortableHeader } from '@/components/ui/sortable-header';
import { Plus, CheckSquare, Square, Eye, EyeOff, Search, X, Trash, FileText } from 'lucide-react';

const DEFAULT_PAGE_SIZE = 10;

export function QuestionList() {
    const [selectedSkillId, setSelectedSkillId] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState<string>('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [sortBy, setSortBy] = useState<string>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const { data: paginatedData, isLoading } = usePaginatedQuestions({
        page,
        pageSize,
        search: debouncedSearch,
        status: statusFilter,
        skillId: selectedSkillId,
        sortBy,
        sortOrder,
    });
    const { data: skills } = useSkills();
    const deleteQuestion = useDeleteQuestion();
    const bulkDelete = useBulkDeleteQuestions();
    const bulkUpdateStatus = useBulkUpdateQuestionsStatus();
    const duplicateQuestion = useDuplicateQuestion();
    const { showToast } = useToast();

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setSelectedIds(new Set());
        setPage(1);
    }, [selectedSkillId, statusFilter]);

    const questions = paginatedData?.data ?? [];
    const totalCount = paginatedData?.totalCount ?? 0;
    const totalPages = paginatedData?.totalPages ?? 1;

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
        setPage(1);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === questions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(questions.map((q: any) => q.id)));
        }
    };

    const handleSelectOne = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (confirm(`Are you sure you want to delete ${selectedIds.size} question(s)?`)) {
            try {
                await bulkDelete.mutateAsync(Array.from(selectedIds));
                showToast(`${selectedIds.size} question(s) deleted`, 'success');
                setSelectedIds(new Set());
            } catch {
                showToast('Failed to delete questions', 'error');
            }
        }
    };

    const handleBulkPublish = async () => {
        if (selectedIds.size === 0) return;
        try {
            await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), is_published: true });
            showToast(`${selectedIds.size} question(s) published`, 'success');
            setSelectedIds(new Set());
        } catch {
            showToast('Failed to publish questions', 'error');
        }
    };

    const handleBulkUnpublish = async () => {
        if (selectedIds.size === 0) return;
        try {
            await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), is_published: false });
            showToast(`${selectedIds.size} question(s) unpublished`, 'success');
            setSelectedIds(new Set());
        } catch {
            showToast('Failed to unpublish questions', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this question?')) {
            try {
                await deleteQuestion.mutateAsync(id);
                showToast('Question deleted', 'success');
            } catch {
                showToast('Failed to delete question', 'error');
            }
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            await duplicateQuestion.mutateAsync(id);
            showToast('Question duplicated', 'success');
        } catch {
            showToast('Failed to duplicate question', 'error');
        }
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        setSelectedIds(new Set());
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setPage(1);
        setSelectedIds(new Set());
    };

    const isAllSelected = questions.length ? selectedIds.size === questions.length : false;
    const hasActiveFilters = searchQuery || statusFilter !== 'all' || selectedSkillId !== 'all';

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setSelectedSkillId('all');
        setPage(1);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-r-transparent"></div>
                    <p className="mt-4 text-gray-500">Loading questions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Questions</h2>
                    <p className="mt-1 text-gray-500">Manage curriculum questions</p>
                </div>
                <Link
                    to="/questions/new"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    <Plus className="h-5 w-5" />
                    New Question
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="space-y-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search questions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                            />
                        </div>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="h-4 w-4" />
                                Clear filters
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-600">Skill:</label>
                            <select
                                value={selectedSkillId}
                                onChange={(e) => setSelectedSkillId(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors text-sm min-w-[200px]"
                            >
                                <option value="all">All Skills</option>
                                {skills?.map((skill: any) => (
                                    <option key={skill.id} value={skill.id}>
                                        {skill.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-600">Status:</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
                                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors text-sm"
                            >
                                <option value="all">All Status</option>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        {selectedIds.size > 0 && (
                            <div className="flex items-center gap-2 ml-auto">
                                <span className="text-sm text-gray-600">{selectedIds.size} selected</span>
                                <button
                                    onClick={handleBulkPublish}
                                    disabled={bulkUpdateStatus.isPending}
                                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                >
                                    <Eye className="h-4 w-4" />
                                    Publish
                                </button>
                                <button
                                    onClick={handleBulkUnpublish}
                                    disabled={bulkUpdateStatus.isPending}
                                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    <EyeOff className="h-4 w-4" />
                                    Unpublish
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={bulkDelete.isPending}
                                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash className="h-4 w-4" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-100">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-4 py-4 w-10">
                                    <button onClick={handleSelectAll} className="text-gray-400 hover:text-gray-600">
                                        {isAllSelected && questions.length > 0 ? <CheckSquare className="h-5 w-5 text-purple-600" /> : <Square className="h-5 w-5" />}
                                    </button>
                                </th>
                                <th className="text-left px-6 py-4">
                                    <SortableHeader
                                        label="Content"
                                        column="content"
                                        currentSortBy={sortBy}
                                        currentSortOrder={sortOrder}
                                        onSort={handleSort}
                                    />
                                </th>
                                <th className="text-left px-6 py-4">
                                    <SortableHeader
                                        label="Type"
                                        column="type"
                                        currentSortBy={sortBy}
                                        currentSortOrder={sortOrder}
                                        onSort={handleSort}
                                    />
                                </th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Skill</th>
                                <th className="text-left px-6 py-4">
                                    <SortableHeader
                                        label="Points"
                                        column="points"
                                        currentSortBy={sortBy}
                                        currentSortOrder={sortOrder}
                                        onSort={handleSort}
                                    />
                                </th>
                                <th className="text-left px-6 py-4">
                                    <SortableHeader
                                        label="Status"
                                        column="is_published"
                                        currentSortBy={sortBy}
                                        currentSortOrder={sortOrder}
                                        onSort={handleSort}
                                    />
                                </th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Orphan</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {!questions.length ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                                <FileText className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 mb-4">
                                                {hasActiveFilters ? 'No questions match your filters.' : 'No questions found. Create one to get started.'}
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
                                                    to="/questions/new"
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Create Question
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                questions.map((question: any) => (
                                    <tr key={question.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <button onClick={() => handleSelectOne(question.id)} className="text-gray-400 hover:text-gray-600">
                                                {selectedIds.has(question.id) ? <CheckSquare className="h-5 w-5 text-purple-600" /> : <Square className="h-5 w-5" />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 max-w-[300px]">
                                            <span className="font-medium text-gray-900 truncate block">{question.content}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                                                {question.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-700">{question.skills?.title}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-semibold text-sm">
                                                {question.points}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {question.is_published ? (
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                    Published
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                                                    Draft
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {!question.skills ? (
                                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                                                    Yes
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                                                    No
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/questions/${question.id}/edit`}
                                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDuplicate(question.id)}
                                                    disabled={duplicateQuestion.isPending}
                                                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors disabled:opacity-50"
                                                >
                                                    Duplicate
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(question.id)}
                                                    className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
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
        </div>
    );
}
