import { useState, useCallback, memo } from 'react';
import { Plus, Pencil, Trash2, Boxes, Search, X, Activity, Layers } from 'lucide-react';
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject, type Subject } from '../hooks/use-subjects';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AdminHeader } from '@/components/ui/admin-header';
import { EmptyState } from '@/components/ui/empty-state';

interface SubjectRowProps {
  subject: Subject;
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
}

const SubjectRow = memo(({ subject, onEdit, onDelete }: SubjectRowProps) => {
  return (
    <TableRow key={subject.subject_id} className="group hover:bg-purple-50/30 transition-colors border-b border-gray-50 last:border-0">
      <TableCell className="px-8 py-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110" style={{ backgroundColor: `${subject.color_hex}15`, border: `1px solid ${subject.color_hex}30` }}>
             <Layers className="w-6 h-6" style={{ color: subject.color_hex || '#8b5cf6' }} />
          </div>
          <div>
            <p className="font-black text-gray-900 tracking-tight text-base italic leading-none">{subject.name}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">ID: {subject.subject_id.split('-')[0]}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-5">
         <code className="px-3 py-1.5 rounded-xl bg-gray-100/50 text-purple-600 font-mono text-[10px] font-black tracking-tight border border-gray-100">
           {subject.slug}
         </code>
      </TableCell>
      <TableCell className="py-5 text-center">
        {subject.icon_url ? (
          <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center mx-auto shadow-sm">
             <img src={subject.icon_url} alt="" className="w-6 h-6 object-contain" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto shadow-sm italic text-[10px] font-black text-gray-300">
            NONE
          </div>
        )}
      </TableCell>
      <TableCell className="py-5">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-xs font-black text-gray-600">
            {subject.display_order ?? 0}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-8 py-5 text-right">
        <div className="flex justify-end gap-2">
           <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onEdit(subject)}
            className="h-10 w-10 rounded-xl text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onDelete(subject.subject_id)}
            className="h-10 w-10 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

export function SubjectsPage() {
  const { data: subjects, isLoading } = useSubjects();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color_hex: '',
    display_order: 1,
  });

  const handleOpenDialog = useCallback((subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name,
        slug: subject.slug,
        description: subject.description || '',
        color_hex: subject.color_hex || '',
        display_order: subject.display_order ?? 1,
      });
    } else {
      setEditingSubject(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        color_hex: '',
        display_order: (subjects?.length ?? 0) + 1,
      });
    }
    setIsDialogOpen(true);
  }, [subjects?.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await updateSubject.mutateAsync({ id: editingSubject.subject_id, ...formData });
        toast({ title: "Success", description: "Taxonomy node updated" });
      } else {
        await createSubject.mutateAsync(formData);
        toast({ title: "Success", description: "Taxonomy node created" });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to persist taxonomy data", variant: "destructive" });
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteSubject.mutateAsync(id);
      toast({ title: "Taxonomy Node Purged", description: "The subject and all associated metadata have been removed from the registry." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to purge taxonomy node", variant: "destructive" });
    }
  }, [deleteSubject, toast]);

  const filteredSubjects = subjects?.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
      <AdminHeader 
        title="Knowledge Taxonomy"
        description="Architect the high-level semantic categories that govern the platform's multi-tenant curriculum shell."
        icon={Boxes}
        breadcrumbs={[
          { label: 'Curriculum', href: '/domains' },
          { label: 'Taxonomy', href: '/platform/subjects' }
        ]}
        actions={
          <Button onClick={() => handleOpenDialog()} className="h-12 px-8 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-600/20 transition-all hover:-translate-y-0.5 gap-3">
            <Plus className="w-4 h-4" /> Provision Taxonomy Node
          </Button>
        }
      />

      {/* Search & Intelligence Bar */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-sm border border-white/20 p-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
          <input
            type="text"
            placeholder="Search taxonomy nodes by name or identifier slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-100 bg-white/50 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none text-sm font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-purple-50 text-gray-400 hover:text-purple-600 rounded-xl transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/10 rounded-xl">
             <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest mr-2">Nodes:</span>
             <span className="text-sm font-black text-purple-700 tracking-tight">{filteredSubjects.length} MAPPED</span>
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-500">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight italic">Category Hierarchy</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 italic">Knowledge Domain Configuration</p>
          </div>
          <Activity className="h-5 w-5 text-gray-200" />
        </div>
        
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b-2 border-gray-100">
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 px-8 h-14">Domain Identity</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-14">Semantic Slug</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-14 text-center">Visual Anchor</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-14">Display Rank</TableHead>
                <TableHead className="text-right px-8 h-14 font-black text-[10px] uppercase tracking-widest text-gray-400">Execution</TableHead>
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
              ) : subjects?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-24">
                    <EmptyState 
                      icon={Boxes}
                      title="Taxonomy Vacuum Detected"
                      description="No knowledge domains have been defined. Initiate a node to begin architecting the platform scope."
                      action={{
                        label: "PROVISION NODE",
                        onClick: () => handleOpenDialog()
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubjects.map((s) => (
                   <SubjectRow 
                     key={s.subject_id} 
                     subject={s} 
                     onEdit={handleOpenDialog} 
                     onDelete={handleDelete} 
                   />
              )))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none bg-white/90 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <form onSubmit={handleSubmit}>
            <div className="p-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-3xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
                  {editingSubject ? <Pencil className="w-8 h-8 text-white" /> : <Plus className="w-8 h-8 text-white" />}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">
                    {editingSubject ? 'Edit Taxonomy Node' : 'Provision Node'}
                  </h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                    {editingSubject ? `Refining ID: ${editingSubject.subject_id.split('-')[0]}` : 'Initializing Knowledge category'}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <Label htmlFor="name" className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Domain Name</Label>
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      placeholder="e.g. Mathematics"
                      required
                      className="h-14 rounded-2xl border-gray-100 bg-white/50 text-gray-800 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-bold italic"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <Label htmlFor="slug" className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Semantic Slug</Label>
                    <Input 
                      id="slug" 
                      value={formData.slug} 
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
                      placeholder="e.g. math"
                      required
                      className="h-14 rounded-2xl border-gray-100 bg-white/50 text-purple-600 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-mono text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <Label htmlFor="color" className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Color Palette (Hex)</Label>
                    <div className="flex gap-3">
                      <div className="h-14 w-14 rounded-2xl border-2 border-dashed border-gray-200 shrink-0" style={{ backgroundColor: formData.color_hex }} />
                      <Input 
                        id="color" 
                        value={formData.color_hex} 
                        onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })} 
                        placeholder="#8b5cf6"
                        className="h-14 rounded-2xl border-gray-100 bg-white/50 text-gray-800 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 group">
                    <Label htmlFor="order" className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Display Rank</Label>
                    <Input 
                      id="order" 
                      type="number"
                      value={formData.display_order} 
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })} 
                      required
                      className="h-14 rounded-2xl border-gray-100 bg-white/50 text-gray-800 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="description" className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Narrative Description</Label>
                  <Input 
                    id="description" 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    placeholder="Brief architectural scope of this knowledge domain"
                    className="h-14 rounded-2xl border-gray-100 bg-white/50 text-gray-800 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="bg-gray-50/50 p-8 flex gap-3 border-t border-gray-100">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-12 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:bg-gray-200 italic transition-all">
                Abort
              </Button>
              <Button type="submit" disabled={createSubject.isPending || updateSubject.isPending} className="h-12 px-10 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-600/20 transition-all hover:-translate-y-0.5">
                {editingSubject ? 'COMMIT CHANGES' : 'EXECUTE PROVISIONING'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
