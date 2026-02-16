import { useGroups, type Group } from '../hooks/use-groups';
import { useState, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Copy, Check, School, Home, Search, X, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminHeader } from '@/components/ui/admin-header';
import { cn } from '@/lib/utils';

import { Skeleton } from '@/components/ui/skeleton';

interface GroupCardProps {
  group: Group;
  onCopy: (code: string, id: string) => void;
  copiedId: string | null;
}

const GroupCard = memo(({ group, onCopy, copiedId }: GroupCardProps) => {
  return (
    <div key={group.id} className="relative group overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/70 backdrop-blur-xl hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-2">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="p-8 relative">
        <div className="flex items-start justify-between mb-8">
          <div className={cn(
            "p-4 rounded-2xl shadow-sm border",
            group.type === 'class' 
              ? "bg-blue-500/10 text-blue-600 border-blue-500/10" 
              : "bg-purple-500/10 text-purple-600 border-purple-500/10"
          )}>
            {group.type === 'class' ? <School className="h-6 w-6" /> : <Home className="h-6 w-6" />}
          </div>
          <span className={cn(
            "text-[9px] uppercase font-black px-3 py-1 rounded-full border tracking-widest shadow-sm",
            group.type === 'class' 
              ? "bg-blue-50 text-blue-600 border-blue-200" 
              : "bg-purple-50 text-purple-600 border-purple-200"
          )}>
            {group.type}
          </span>
        </div>
        
        <h3 className="text-xl font-black text-gray-900 mb-2 line-clamp-1 tracking-tight" title={group.name}>
          {group.name}
        </h3>
        
        <div className="mt-8 p-1.5 rounded-2xl bg-gray-100/50 border border-gray-100 flex items-center justify-between pl-4 pr-1.5 py-1.5">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">Access Code</span>
            <span className="text-lg font-mono font-black text-indigo-600 tracking-[0.2em] leading-none pb-0.5">
              {group.join_code}
            </span>
          </div>
          <button 
            onClick={() => onCopy(group.join_code, group.id)}
            className="h-11 w-11 flex items-center justify-center rounded-xl bg-white border border-gray-100 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-gray-400 hover:text-indigo-600 shadow-sm active:scale-90"
            title="Copy Join Code"
          >
            {copiedId === group.id ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>
      </div>
      
      <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between group-hover:bg-indigo-500 transition-all duration-500">
        <div className="flex items-center gap-2">
           <Activity className="h-3.5 w-3.5 text-gray-300 group-hover:text-white/50" />
           <span className="text-xs font-bold text-gray-500 group-hover:text-white/80 transition-colors">Cluster Active</span>
        </div>
        <Link 
          to={`/groups/${group.id}`} 
          className="text-[11px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 p-2 group-hover:text-white group-hover:bg-white/10 rounded-xl transition-all"
        >
          Configure &rarr;
        </Link>
      </div>
    </div>
  );
});

export function GroupsPage() {
  const { data: groups, isLoading } = useGroups();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter(group => 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.join_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groups, searchTerm]);

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
      <AdminHeader
        title="Squad Registry"
        description="Manage mentorship groups."
        icon={Users}
        actions={
          <Button asChild size="lg" className="bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-2xl px-6 py-6 shadow-lg shadow-indigo-600/20 font-black text-sm uppercase tracking-widest gap-2 transition-all hover:-translate-y-0.5 border-0">
            <Link to="/groups/new">
              <Plus className="w-5 h-5" />
              Initialize Squad
            </Link>
          </Button>
        }
      />

      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/20 p-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search squads by name or authorization code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-100 bg-white/50 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/10 rounded-xl flex items-center gap-2">
             <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Inventory:</span>
             <span className="text-sm font-black text-indigo-700 tracking-tight">{filteredGroups.length} REGISTERED</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-[2.5rem] border border-gray-100 shadow-sm" />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-[3rem] border border-dashed border-gray-200 bg-white/30 backdrop-blur-md text-center shadow-inner">
          <div className="h-20 w-20 bg-gray-50 border border-white rounded-[2rem] flex items-center justify-center mb-6 shadow-sm">
            <Users className="h-10 w-10 text-gray-300" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">No Active Squads</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-10 text-sm font-medium leading-relaxed">
            Begin your mentorship journey by establishing a new cluster for classes or families.
          </p>
          <Button asChild size="lg" variant="outline" className="rounded-2xl px-10 border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 transition-all font-bold uppercase tracking-widest text-[11px]">
            <Link to="/groups/new">
              <Plus className="mr-2 h-4 w-4" />
              Create First Squad
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredGroups.map((group) => (
             <GroupCard 
               key={group.id} 
               group={group} 
               onCopy={copyCode} 
               copiedId={copiedId} 
             />
          ))}
        </div>
      )}
    </div>
  );
}
