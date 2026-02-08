import { Link } from 'react-router-dom';
import { Book, FlaskConical, HelpCircle, Upload, Plus, Clock, TrendingUp } from 'lucide-react';
import { useDashboardStats, useRecentActivity } from '../hooks/use-dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  subValue 
}: { 
  icon: React.ElementType;
  iconClassName: string;
  containerClassName: string;
  value: number | string;
  label: string;
  subValue?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`p-3 rounded-xl ${containerClassName}`}>
          <Icon className={`w-6 h-6 ${iconClassName}`} />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
        </div>
      </CardContent>
    </Card>
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
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome to Questerix Curriculum Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Book}
          containerClassName="bg-purple-100 dark:bg-purple-900/20"
          iconClassName="text-purple-600 dark:text-purple-400"
          value={statsLoading ? '...' : stats?.totalDomains ?? 0}
          label="Domains"
          subValue={statsLoading ? undefined : `${stats?.liveDomains ?? 0} live`}
        />
        <StatCard
          icon={FlaskConical}
          containerClassName="bg-blue-100 dark:bg-blue-900/20"
          iconClassName="text-blue-600 dark:text-blue-400"
          value={statsLoading ? '...' : stats?.totalSkills ?? 0}
          label="Skills"
          subValue={statsLoading ? undefined : `${stats?.liveSkills ?? 0} live`}
        />
        <StatCard
          icon={HelpCircle}
          containerClassName="bg-green-100 dark:bg-green-900/20"
          iconClassName="text-green-600 dark:text-green-400"
          value={statsLoading ? '...' : stats?.totalQuestions ?? 0}
          label="Questions"
          subValue={statsLoading ? undefined : `${stats?.liveQuestions ?? 0} live`}
        />
        <StatCard
          icon={Upload}
          containerClassName="bg-orange-100 dark:bg-orange-900/20"
          iconClassName="text-orange-600 dark:text-orange-400"
          value={statsLoading ? '...' : `v${stats?.currentVersion ?? 0}`}
          label="Current Version"
          subValue={
            statsLoading 
              ? undefined 
              : stats?.lastPublishedAt 
                ? `Published ${formatRelativeTime(stats.lastPublishedAt)}` 
                : 'Never published'
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link to="/domains/new">
              <Button variant="outline" className="w-full justify-start h-auto p-4" asChild>
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Add Domain</div>
                    <div className="text-xs text-muted-foreground">Create a new subject area</div>
                  </div>
                </div>
              </Button>
            </Link>
            
            <Link to="/skills/new">
              <Button variant="outline" className="w-full justify-start h-auto p-4" asChild>
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Add Skill</div>
                    <div className="text-xs text-muted-foreground">Define a new learning objective</div>
                  </div>
                </div>
              </Button>
            </Link>

            <Link to="/questions/new">
              <Button variant="outline" className="w-full justify-start h-auto p-4" asChild>
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Add Question</div>
                    <div className="text-xs text-muted-foreground">Create a new practice problem</div>
                  </div>
                </div>
              </Button>
            </Link>

            <Link to="/publish">
              <Button variant="outline" className="w-full justify-start h-auto p-4" asChild>
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Publish Curriculum</div>
                    <div className="text-xs text-muted-foreground">Push changes to student apps</div>
                  </div>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : activities?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mb-2 opacity-20" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mt-4">
                {activities?.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  const colors = getActivityColor(activity.type);
                  return (
                    <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                      <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${colors.bg}`}>
                        <Icon className={`w-4 h-4 ${colors.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{activity.type} {activity.action}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 shadow-lg text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Content Overview</h3>
            <p className="text-purple-100 text-sm opacity-90">
              {statsLoading ? 'Loading...' : (
                `${stats?.liveDomains ?? 0} of ${stats?.totalDomains ?? 0} domains, ` +
                `${stats?.liveSkills ?? 0} of ${stats?.totalSkills ?? 0} skills, and ` +
                `${stats?.liveQuestions ?? 0} of ${stats?.totalQuestions ?? 0} questions are live` +
                (stats?.readyToPublish ? ` (${stats.readyToPublish} ready to publish)` : '')
              )}
            </p>
          </div>
          <Link to="/publish">
            <Button variant="secondary" className="font-medium shadow-sm">
              Review & Publish
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  // Simple local loader to avoid import if Lucide version doesn't export it yet? 
  // Wait, Lucide exports Loader2. I'll import it.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
