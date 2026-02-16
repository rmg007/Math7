import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Book, FlaskConical, HelpCircle, Upload, Plus, Clock, TrendingUp, LayoutDashboard } from 'lucide-react';
import { useDashboardStats, useRecentActivity } from '../hooks/use-dashboard';
import { Button } from '@/components/ui/button';
import { AdminHeader } from '@/components/ui/admin-header';
import { Skeleton } from '@/components/ui/skeleton';

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function StatCard({ 
  icon: Icon, 
  iconClassName,
  containerClassName,
  value, 
  label, 
  subValue,
  isLoading
}: { 
  icon: React.ElementType;
  iconClassName: string;
  containerClassName: string;
  value: number | string;
  label: string;
  subValue?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/20 p-8 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden relative">
      <div className="flex items-center gap-5 relative z-10">
        <div className={cn("p-3.5 rounded-2xl group-hover:scale-110 transition-transform duration-500", containerClassName)}>
          <Icon className={cn("w-6 h-6", iconClassName)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <Skeleton className="h-8 w-16 rounded-lg" />
            ) : (
              <span className="text-3xl font-black text-gray-900 tracking-tight">{value}</span>
            )}
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{label}</p>
        </div>
      </div>
      {subValue && !isLoading && (
        <div className="mt-4 pt-4 border-t border-gray-100/50 flex items-center justify-between">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{subValue}</span>
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500/50" />
        </div>
      )}
      {/* Subtle background glow */}
      <div className={cn("absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 rounded-full", containerClassName)}></div>
    </div>
  );
}

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activities, isLoading: activitiesLoading } = useRecentActivity();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'domain': return Book;
      case 'skill': return FlaskConical;
      case 'question': return HelpCircle;
      default: return Book;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'domain': return { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' };
      case 'skill': return { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' };
      case 'question': return { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' };
      default: return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
      <AdminHeader 
        title="Curriculum Intelligence"
        description="Domains, skills, and publications."
        icon={LayoutDashboard}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Book}
          containerClassName="bg-purple-500/10"
          iconClassName="text-purple-600"
          value={stats?.totalDomains ?? 0}
          label="Knowledge Domains"
          subValue={`${stats?.liveDomains ?? 0} Active Protocols`}
          isLoading={statsLoading}
        />
        <StatCard
          icon={FlaskConical}
          containerClassName="bg-blue-500/10"
          iconClassName="text-blue-600"
          value={stats?.totalSkills ?? 0}
          label="Learning Objectives"
          subValue={`${stats?.liveSkills ?? 0} Verified Skills`}
          isLoading={statsLoading}
        />
        <StatCard
          icon={HelpCircle}
          containerClassName="bg-emerald-500/10"
          iconClassName="text-emerald-600"
          value={stats?.totalQuestions ?? 0}
          label="Assessment Nodes"
          subValue={`${stats?.liveQuestions ?? 0} Production Ready`}
          isLoading={statsLoading}
        />
        <StatCard
          icon={Upload}
          containerClassName="bg-amber-500/10"
          iconClassName="text-amber-600"
          value={`v${stats?.currentVersion ?? 0}`}
          label="Release State"
          subValue={stats?.lastPublishedAt ? `Sync ${formatRelativeTime(stats.lastPublishedAt)}` : 'Manual Reset Pending'}
          isLoading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Command Center</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 italic">Authorized Core Actions</p>
            </div>
            <Plus className="h-5 w-5 text-gray-200" />
          </div>
          <div className="p-8 grid gap-4">
            <Link to="/domains/new">
              <Button variant="outline" className="w-full justify-start h-auto p-5 rounded-2xl border-gray-100 hover:border-purple-600 hover:bg-purple-50 group/btn transition-all" asChild>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 group-hover/btn:scale-110 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-gray-900 text-sm italic tracking-tight uppercase">Initialize Domain</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Scale subject area catalog</div>
                  </div>
                </div>
              </Button>
            </Link>
            
            <Link to="/skills/new">
              <Button variant="outline" className="w-full justify-start h-auto p-5 rounded-2xl border-gray-100 hover:border-blue-600 hover:bg-blue-50 group/btn transition-all" asChild>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 group-hover/btn:scale-110 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-gray-900 text-sm italic tracking-tight uppercase">Draft Objective</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Define learning milestones</div>
                  </div>
                </div>
              </Button>
            </Link>

            <Link to="/questions/new">
              <Button variant="outline" className="w-full justify-start h-auto p-5 rounded-2xl border-gray-100 hover:border-emerald-600 hover:bg-emerald-50 group/btn transition-all" asChild>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover/btn:scale-110 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-gray-900 text-sm italic tracking-tight uppercase">Forge Node</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Author assessment content</div>
                  </div>
                </div>
              </Button>
            </Link>

            <Link to="/publish">
              <Button variant="outline" className="w-full justify-start h-auto p-5 rounded-2xl border-gray-100 hover:border-amber-600 hover:bg-amber-50 group/btn transition-all" asChild>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 group-hover/btn:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-gray-900 text-sm italic tracking-tight uppercase">Handover to Live</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Publish curriculum updates</div>
                  </div>
                </div>
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Signal Stream</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 italic">Real-time Activity Ledger</p>
            </div>
            <Clock className="h-5 w-5 text-gray-200" />
          </div>
          <div className="p-8">
            {activitiesLoading ? (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            ) : activities?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-center mb-4">
                   <TrendingUp className="w-8 h-8 text-gray-200" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 tracking-tight">Zero Activity Recorded</h4>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Initialize curriculum to see events</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
                {activities?.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  const colors = getActivityColor(activity.type);
                  return (
                    <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/50 transition-all border border-transparent hover:border-white/40 hover:shadow-sm group/item">
                      <div className={cn("flex items-center justify-center w-11 h-11 rounded-xl group-hover/item:scale-105 transition-transform", colors.bg)}>
                        <Icon className={cn("w-5 h-5", colors.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900 tracking-tight italic">{activity.title}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{activity.type} {activity.action}</p>
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter tabular-nums whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] -mr-32 -mt-32 rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 blur-[60px] -ml-24 -mb-24 rounded-full"></div>
        
        <div className="flex items-center justify-between flex-wrap gap-10 relative z-10">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-2 uppercase italic">Global Integrity Summary</h3>
            <div className="flex flex-col gap-1">
              <p className="text-indigo-100/90 text-sm font-bold leading-relaxed tracking-tight max-w-2xl">
                {statsLoading ? 'Calculating systemic footprint...' : (
                  <>
                    Deploying <span className="text-white font-black">{stats?.liveDomains ?? 0}</span> domains, <span className="text-white font-black">{stats?.liveSkills ?? 0}</span> learning objectives, and <span className="text-white font-black">{stats?.liveQuestions ?? 0}</span> production nodes. 
                    {stats?.readyToPublish ? <span className="inline-flex items-center ml-2 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/20 rounded-md text-[10px] text-emerald-300 font-black uppercase tracking-widest">{stats.readyToPublish} UPDATES STAGED</span> : ''}
                  </>
                )}
              </p>
            </div>
          </div>
          <Link to="/publish">
            <Button size="lg" className="bg-white text-indigo-700 hover:bg-white/90 font-black text-xs uppercase tracking-[0.2em] rounded-2xl h-14 px-10 shadow-xl shadow-black/5 active:scale-95 transition-all">
              Initiate Sync Protocol
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
