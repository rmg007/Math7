import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
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
import {
  ArrowRight,
  ChevronLeft,
  Globe,
  LayoutPanelTop,
  Megaphone,
  Monitor,
  Pencil,
  Plus,
  Save,
  Search,
  Terminal,
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
    try {
      await updateLanding.mutateAsync({
        id: editingLanding.landing_page_id,
        ...formData,
      });
      toast({ title: 'Success', description: 'Landing page configuration updated' });
      setEditingLanding(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update landing page',
        variant: 'destructive',
      });
    }
  };

  const handleCreate = async () => {
    if (!selectedAppId) {
      toast({
        title: 'Error',
        description: 'Please select a target application',
        variant: 'destructive',
      });
      return;
    }

    // Check if app already has a landing page
    const existing = landings?.find((l) => l.app_id === selectedAppId);
    if (existing) {
      toast({
        title: 'Notice',
        description: 'This app already has a landing registry. Redirecting to editor.',
      });
      handleEdit(existing);
      setIsCreateDialogOpen(false);
      return;
    }

    try {
      const newLanding = await createLanding.mutateAsync({
        app_id: selectedAppId,
        hero_headline: 'Welcome to the Future of Learning',
        hero_subheadline: 'Engage with a personalized curriculum designed for your specific goals.',
        meta_title:
          apps?.find((a) => a.app_id === selectedAppId)?.display_name || 'Academic Portal',
        meta_description: 'Experience premium educational content with Questerix.',
      });
      toast({ title: 'Success', description: 'Landing registry initialized' });
      setIsCreateDialogOpen(false);
      handleEdit(newLanding as LandingPageWithApp);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initialize landing registry',
        variant: 'destructive',
      });
    }
  };

  if (editingLanding) {
    return (
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingLanding(null)}
              className="h-12 w-12 rounded-2xl bg-white/50 border border-white/20 hover:bg-white transition-all"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </Button>
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight italic">
                Content Editor
              </h2>
              <p className="text-2xs font-black text-gray-400 uppercase tracking-extra-wide mt-1">
                Refining: {editingLanding.apps?.display_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setEditingLanding(null)}
              className="h-12 px-8 rounded-2xl font-black text-2xs uppercase tracking-widest text-gray-400 hover:bg-gray-100 italic transition-all"
            >
              Abort Editing
            </Button>
            <Button
              onClick={handleSave}
              className="h-12 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-2xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
              disabled={updateLanding.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateLanding.isPending ? 'SYNCHRONIZING...' : 'COMMIT CHANGES'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-sm border border-white/20 space-y-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/10">
                <Megaphone className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Hero Narrative</h3>
                <p className="text-2xs font-black text-gray-400 uppercase tracking-widest italic">
                  User-facing brand messaging
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2 group">
                <Label className="text-2xs font-black text-gray-400 uppercase tracking-widest pl-1">
                  Primary Headline
                </Label>
                <Input
                  value={formData.hero_headline}
                  onChange={(e) => setFormData({ ...formData, hero_headline: e.target.value })}
                  className="h-14 rounded-2xl border-gray-100 bg-white/50 text-gray-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-base font-bold italic"
                  placeholder="The core hook for your audience"
                />
              </div>
              <div className="space-y-2 group">
                <Label className="text-2xs font-black text-gray-400 uppercase tracking-widest pl-1">
                  Secondary Narrative
                </Label>
                <Textarea
                  rows={6}
                  value={formData.hero_subheadline}
                  onChange={(e) => setFormData({ ...formData, hero_subheadline: e.target.value })}
                  className="rounded-[2rem] border-gray-100 bg-white/50 text-gray-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium leading-relaxed p-6"
                  placeholder="Supporting details that build trust and clarity"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-sm border border-white/20 space-y-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/10">
                <Terminal className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">SEO Metadata</h3>
                <p className="text-2xs font-black text-gray-400 uppercase tracking-widest italic">
                  Search engine index parameters
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2 group">
                <Label className="text-2xs font-black text-gray-400 uppercase tracking-widest pl-1">
                  Meta Title Tag
                </Label>
                <Input
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  className="h-14 rounded-2xl border-gray-100 bg-white/50 text-gray-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold"
                  placeholder="Target browser tab title"
                />
              </div>
              <div className="space-y-2 group">
                <Label className="text-2xs font-black text-gray-400 uppercase tracking-widest pl-1">
                  Crawler Description
                </Label>
                <Textarea
                  rows={6}
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  className="rounded-[2rem] border-gray-100 bg-white/50 text-gray-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium leading-relaxed p-6"
                  placeholder="Snippet displayed in search results"
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
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
      <AdminHeader
        title="Marketing Registry"
        description="Manage app landing pages."
        icon={Globe}
        actions={
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-2xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 gap-3"
          >
            <Plus className="w-4 h-4" /> Provision Landing Registry
          </Button>
        }
      />

      {/* Search & Intelligence Bar */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/20 p-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search landing registries by application name or headline..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-100 bg-white/50 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/10 rounded-xl flex items-center gap-2">
            <span className="text-2xs font-black text-indigo-500 uppercase tracking-widest">
              Registries:
            </span>
            <span className="text-sm font-black text-indigo-700 tracking-tight">
              {filteredLandings.length} ACTIVE
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-500">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b-2 border-gray-100">
                <TableHead className="font-black text-2xs uppercase tracking-widest text-gray-400 px-8 h-14">
                  Target Application
                </TableHead>
                <TableHead className="font-black text-2xs uppercase tracking-widest text-gray-400 h-14">
                  Deployment URL
                </TableHead>
                <TableHead className="font-black text-2xs uppercase tracking-widest text-gray-400 h-14">
                  Primary Hook
                </TableHead>
                <TableHead className="font-black text-2xs uppercase tracking-widest text-gray-400 h-14">
                  Node Status
                </TableHead>
                <TableHead className="text-right px-8 h-14 font-black text-2xs uppercase tracking-widest text-gray-400">
                  Execution
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell colSpan={5} className="px-8 py-6">
                      <div className="h-10 bg-gray-100/50 rounded-2xl w-full"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : landings?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-24">
                    <EmptyState
                      icon={LayoutPanelTop}
                      title="No Marketing Records Identified"
                      description="Create your first landing page."
                      action={
                        <Button
                          onClick={() => setIsCreateDialogOpen(true)}
                          className="rounded-full px-8 shadow-md"
                        >
                          INITIATE REGISTRY
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLandings.map((l) => (
                  <TableRow
                    key={l.landing_page_id}
                    className="group hover:bg-indigo-50/30 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <TableCell className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                          <Monitor className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 tracking-tight text-base italic leading-none">
                            {l.apps?.display_name}
                          </p>
                          <p className="text-2xs font-black text-gray-400 uppercase tracking-widest mt-1">
                            Tenant ID: {l.app_id?.split('-')[0] || 'UNMAPPED'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100/50 text-indigo-600 font-mono text-2xs font-black tracking-tight w-fit">
                        {l.apps?.subdomain}.questerix.com
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <p className="font-black text-xs text-gray-600 tracking-tight italic line-clamp-1 max-w-[200px]">
                        "{l.hero_headline || 'NULL_HOOK'}"
                      </p>
                    </TableCell>
                    <TableCell className="py-5">
                      <StatusBadge
                        status={l.is_published ? 'live' : 'draft'}
                        label={l.is_published ? 'OPERATIONAL' : 'DRAFTING'}
                      />
                    </TableCell>
                    <TableCell className="px-8 py-5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(l)}
                        className="h-10 px-4 rounded-xl font-black text-2xs uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 gap-2 overflow-hidden group/btn"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        REWRITE
                        <ArrowRight className="w-3.5 h-3.5 -translate-x-4 opacity-0 transition-all group-hover/btn:translate-x-0 group-hover/btn:opacity-100" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredLandings.length > 0 && (
          <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-100">
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
        <DialogContent className="rounded-[2.5rem] border-none bg-white/90 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <DialogTitle className="sr-only">Initialize Registry</DialogTitle>
          <div className="p-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">
                  Initialize Registry
                </h2>
                <p className="text-2xs font-black text-gray-400 uppercase tracking-widest mt-1">
                  Select application endpoint
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-2xs font-black text-gray-400 uppercase tracking-widest pl-1">
                  Target Tenant
                </Label>
                <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                  <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-white shadow-sm font-bold text-gray-700">
                    <SelectValue placeholder="Identify Unmapped Application..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-gray-100 shadow-xl p-2">
                    {apps
                      ?.filter((app) => !landings?.some((l) => l.app_id === app.app_id))
                      .map((app) => (
                        <SelectItem
                          key={app.app_id}
                          value={app.app_id}
                          className="rounded-xl py-3 font-bold"
                        >
                          {app.display_name} ({app.subdomain})
                        </SelectItem>
                      ))}
                    {apps?.filter((app) => !landings?.some((l) => l.app_id === app.app_id))
                      .length === 0 && (
                      <div className="p-4 space-y-3">
                        <div className="text-xs font-black text-center text-rose-400 uppercase tracking-widest italic">
                          Registry saturated. All nodes mapped.
                        </div>
                        <div className="text-center">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="rounded-xl font-black text-2xs uppercase tracking-widest"
                          >
                            <Link to="/apps">Create New Application</Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-gray-50/50 p-8 flex gap-3 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setIsCreateDialogOpen(false)}
              className="h-12 px-8 rounded-2xl font-black text-2xs uppercase tracking-widest text-gray-400 hover:bg-gray-200 italic transition-all"
            >
              Abort
            </Button>
            <Button
              onClick={handleCreate}
              className="h-12 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-2xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
              disabled={createLanding.isPending}
            >
              {createLanding.isPending ? 'EXECUTING...' : 'INITIATE REGISTRY'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
