import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { normalizeFormData } from '@/lib/normalization';
import {
  ChevronLeft,
  Globe,
  LayoutPanelTop,
  Pencil,
  Plus,
  Save,
  Search,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApps } from '../hooks/use-apps';
import {
  useCreateLandingPage,
  useLandingPages,
  useUpdateLandingPage,
  type LandingPageWithApp,
} from '../hooks/use-landings';

export function LandingsPage() {
  const { data: landings, isLoading } = useLandingPages();
  const { data: apps } = useApps();
  const updateLanding = useUpdateLandingPage();
  const createLanding = useCreateLandingPage();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingLanding, setEditingLanding] = useState<LandingPageWithApp | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formData, setFormData] = useState({
    hero_headline: '',
    hero_subheadline: '',
    meta_title: '',
    meta_description: '',
  });

  const handleEdit = (landing: LandingPageWithApp) => {
    setEditingLanding(landing);
    setFormData({
      hero_headline: landing.hero_headline || '',
      hero_subheadline: landing.hero_subheadline || '',
      meta_title: landing.meta_title || '',
      meta_description: landing.meta_description || '',
    });
  };

  const handleSave = async () => {
    if (!editingLanding || !editingLanding.landing_page_id) return;

    const normalizedData = normalizeFormData(formData, {
      trim: ['hero_headline', 'hero_subheadline', 'meta_title', 'meta_description'],
    });

    try {
      await updateLanding.mutateAsync({
        id: editingLanding.landing_page_id,
        ...normalizedData,
      });
      toast({ title: 'Success', description: 'Landing page updated' });
      setEditingLanding(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update landing page', variant: 'destructive' });
    }
  };

  const handleCreate = async () => {
    if (!selectedAppId) {
      toast({ title: 'Error', description: 'Please select an application', variant: 'destructive' });
      return;
    }

    const existing = landings?.find((l) => l.app_id === selectedAppId);
    if (existing) {
      toast({ title: 'Notice', description: 'This app already has a landing page.' });
      handleEdit(existing);
      setIsCreateDialogOpen(false);
      return;
    }

    try {
      const newLanding = await createLanding.mutateAsync({
        app_id: selectedAppId,
        hero_headline: 'Welcome to the Future of Learning',
        hero_subheadline: 'Engage with a personalized curriculum designed for your specific goals.',
        meta_title: apps?.find((a) => a.app_id === selectedAppId)?.display_name || 'Academic Portal',
        meta_description: 'Experience premium educational content with Questerix.',
      });
      toast({ title: 'Success', description: 'Landing page created' });
      setIsCreateDialogOpen(false);
      handleEdit(newLanding as LandingPageWithApp);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create landing page', variant: 'destructive' });
    }
  };

  // Editor view
  if (editingLanding) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingLanding(null)}
              className="h-9 w-9 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Edit Landing Page
              </h2>
              <p className="text-xs text-gray-500">
                {editingLanding.apps?.display_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setEditingLanding(null)}
              className="h-9 px-4 rounded text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="h-9 px-4 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm"
              disabled={updateLanding.isPending}
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {updateLanding.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Hero Content */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Hero Content</h3>
              <p className="text-xs text-gray-500 mt-0.5">User-facing messaging</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Headline</Label>
                <Input
                  value={formData.hero_headline}
                  onChange={(e) => setFormData({ ...formData, hero_headline: e.target.value })}
                  className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm"
                  placeholder="Main headline"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Subheadline</Label>
                <Textarea
                  rows={4}
                  value={formData.hero_subheadline}
                  onChange={(e) => setFormData({ ...formData, hero_subheadline: e.target.value })}
                  className="rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm p-3"
                  placeholder="Supporting text"
                />
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">SEO Metadata</h3>
              <p className="text-xs text-gray-500 mt-0.5">Search engine settings</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Meta Title</Label>
                <Input
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm"
                  placeholder="Browser tab title"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Meta Description</Label>
                <Textarea
                  rows={4}
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  className="rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm p-3"
                  placeholder="Search result description"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredLandings =
    landings?.filter(
      (l) =>
        l.apps?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.hero_headline?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const paginatedLandings = filteredLandings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
      <AdminHeader
        title="Landing Pages"
        description="Manage marketing pages."
        icon={Globe}
        className="mb-2"
        actions={
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="h-9 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> New Landing Page
          </Button>
        }
      />

      <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
        {/* Card Header: Search + Count */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search landing pages..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-1.5 rounded border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 outline-none focus-visible:outline-none text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded"
                title="Clear"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <span className="text-[11px] text-gray-500 whitespace-nowrap">
            {filteredLandings.length} {filteredLandings.length === 1 ? 'page' : 'pages'}
          </span>
        </div>

        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="px-4">
                Application
              </TableHead>
              <TableHead className="hidden md:table-cell">
                URL
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                Headline
              </TableHead>
              <TableHead>
                Status
              </TableHead>
              <TableHead className="text-right px-4 border-l border-gray-100">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="even:bg-gray-50/40">
                  <TableCell className="px-4">
                    <div className="h-3.5 bg-gray-200 rounded w-28 animate-pulse"></div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="h-3.5 bg-gray-200 rounded w-36 animate-pulse"></div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="h-3.5 bg-gray-200 rounded w-40 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded-full w-14 animate-pulse"></div>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="h-7 w-14 bg-gray-200 rounded animate-pulse ml-auto"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : landings?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20">
                  <EmptyState
                    icon={LayoutPanelTop}
                    title="No landing pages yet"
                    description="Create your first landing page to get started."
                    action={
                      <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                      >
                        New Landing Page
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedLandings.map((l) => (
                <TableRow
                  key={l.landing_page_id}
                  className="even:bg-gray-50/40"
                >
                  <TableCell className="px-4">
                    <span className="font-medium text-gray-900 text-xs truncate">
                      {l.apps?.display_name}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <a
                      href={`https://${l.apps?.subdomain}.questerix.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-600 font-mono hover:underline"
                    >
                      {l.apps?.subdomain}.questerix.com
                    </a>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">
                      {l.hero_headline || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={l.is_published ? 'published' : 'draft'}
                    />
                  </TableCell>
                  <TableCell className="px-4 text-right border-l border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(l)}
                      className="h-7 px-2 rounded text-xs text-gray-400 hover:text-teal-600 hover:bg-teal-50 gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {filteredLandings.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredLandings.length / pageSize)}
              totalCount={filteredLandings.length}
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="rounded-lg border border-gray-200 bg-white p-0 overflow-hidden shadow-lg max-w-md">
          <div className="px-6 pt-6 pb-4 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                <DialogTitle>Create Landing Page</DialogTitle>
              </h2>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                Select an application to create a landing page for.
              </DialogDescription>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">Application</Label>
              <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                <SelectTrigger className="h-9 rounded border border-gray-300 bg-white text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm">
                  <SelectValue placeholder="Select application..." />
                </SelectTrigger>
                <SelectContent className="rounded-lg border border-gray-200 shadow-md">
                  {apps
                    ?.filter((app) => !landings?.some((l) => l.app_id === app.app_id))
                    .map((app) => (
                      <SelectItem key={app.app_id} value={app.app_id} className="text-sm">
                        {app.display_name} ({app.subdomain})
                      </SelectItem>
                    ))}
                  {apps?.filter((app) => !landings?.some((l) => l.app_id === app.app_id)).length === 0 && (
                    <div className="p-3 text-center space-y-2">
                      <p className="text-xs text-gray-500">All applications already have landing pages.</p>
                      <Button asChild variant="outline" size="sm" className="text-xs">
                        <Link to="/apps">Create New Application</Link>
                      </Button>
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="bg-gray-50 px-6 py-4 flex gap-2 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={() => setIsCreateDialogOpen(false)}
              className="h-9 px-4 rounded text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              className="h-9 px-5 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={createLanding.isPending}
            >
              {createLanding.isPending ? 'Creating...' : 'Create Landing Page'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
