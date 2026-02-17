import { AdminHeader } from '@/components/ui/admin-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import {
    Activity,
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    BookOpen,
    BrainCircuit,
    Database,
    Layers,
} from 'lucide-react';
import React, { useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e'];

export function DashboardPage() {
  const { currentApp, isSuperAdmin } = useApp();
  const [viewMode, setViewMode] = useState<'current' | 'all'>('current');

  // Fetch Global Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', currentApp?.app_id, isSuperAdmin, viewMode],
    queryFn: async () => {
      const shouldFilterByApp = !isSuperAdmin || viewMode === 'current';

      type CountableTable = 'domains' | 'skills' | 'questions';
      const createQuery = (table: CountableTable, select: string) => {
        let query = supabase.from(table).select(select, { count: 'exact', head: true });
        if (shouldFilterByApp && currentApp?.app_id) {
          query = query.eq('app_id', currentApp.app_id);
        }
        return query;
      };

      const results = await Promise.all([
        createQuery('domains', 'domain_id'),
        createQuery('skills', 'skill_id'),
        createQuery('questions', 'question_id'),
        supabase
          .from('error_logs')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        (() => {
          let query = supabase.from('questions').select('type');
          if (shouldFilterByApp && currentApp?.app_id) {
            query = query.eq('app_id', currentApp.app_id);
          }
          return query;
        })(),
      ]);

      // Compute question type distribution from real data
      const questionTypes = results[4].data || [];
      const typeCounts: Record<string, number> = {};
      questionTypes.forEach((q) => {
        const type = q.type || 'unknown';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      const TYPE_LABELS: Record<string, string> = {
        multiple_choice: 'MCQ',
        text_input: 'Input',
        boolean: 'Boolean',
        mcq_multi: 'Multi-MCQ',
        reorder_steps: 'Reorder',
      };

      const questionDistribution = Object.entries(typeCounts)
        .map(([type, count]) => ({
          name: TYPE_LABELS[type] || type,
          value: count,
        }))
        .sort((a, b) => b.value - a.value);

      return {
        domains: results[0].count || 0,
        skills: results[1].count || 0,
        questions: results[2].count || 0,
        errors24h: results[3].count || 0,
        questionDistribution,
      };
    },
    enabled: Boolean(currentApp),
  });

  // TODO: Replace with real time-series data when import/error logging tracks daily counts
  const activityData = [
    { name: 'Mon', imports: 40, errors: 24 },
    { name: 'Tue', imports: 30, errors: 13 },
    { name: 'Wed', imports: 20, errors: 98 },
    { name: 'Thu', imports: 27, errors: 39 },
    { name: 'Fri', imports: 18, errors: 48 },
    { name: 'Sat', imports: 23, errors: 38 },
    { name: 'Sun', imports: 34, errors: 43 },
  ];

  const aiUsageData = stats?.questionDistribution?.length
    ? stats.questionDistribution
    : [{ name: 'No data', value: 1 }];

  if (statsLoading) {
    return (
      <div className="flex flex-col gap-8 p-8 animate-pulse">
        <div className="h-12 w-1/3 bg-gray-100 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-100 rounded-2xl" />
          <div className="h-80 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  const errorStatus =
    (stats?.errors24h || 0) === 0
      ? { trend: '0 errors', trendUp: true }
      : {
          trend: `${stats?.errors24h} error${(stats?.errors24h || 0) > 1 ? 's' : ''}`,
          trendUp: false,
        };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <AdminHeader title="Dashboard" description="Platform overview." icon={Activity} />

      {isSuperAdmin && (
        <div className="flex items-center gap-4 p-4 bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
          <span className="text-sm font-semibold text-gray-700">View Mode:</span>
          <div className="flex rounded-lg bg-gray-100 p-1">
            <Button
              variant={viewMode === 'current' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('current')}
              className="rounded-md px-3 py-1 text-xs font-semibold"
            >
              Current App
            </Button>
            <Button
              variant={viewMode === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('all')}
              className="rounded-md px-3 py-1 text-xs font-semibold"
            >
              All Apps
            </Button>
          </div>
          <Badge variant="secondary" className="text-xs">
            Super Admin
          </Badge>
        </div>
      )}

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Questions"
          value={stats?.questions || 0}
          icon={BookOpen}
          trend={`${stats?.questions || 0} total`}
          trendUp={true}
          color="indigo"
          isLoading={statsLoading}
        />
        <StatCard
          title="Skills"
          value={stats?.skills || 0}
          icon={BrainCircuit}
          trend={`${stats?.skills || 0} total`}
          trendUp={true}
          color="purple"
          isLoading={statsLoading}
        />
        <StatCard
          title="Errors (24h)"
          value={stats?.errors24h || 0}
          icon={AlertCircle}
          trend={errorStatus.trend}
          trendUp={errorStatus.trendUp}
          color="rose"
          isLoading={statsLoading}
        />
        <StatCard
          title="Domains"
          value={stats?.domains || 0}
          icon={Layers}
          trend={`${stats?.domains || 0} active`}
          trendUp={true}
          color="blue"
          isLoading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Activity Chart — TODO: wire to real time-series data */}
        <Card className="lg:col-span-2 border-white/40 shadow-xl shadow-indigo-500/5 bg-white/60 backdrop-blur-xl overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div>
              <CardTitle className="text-xl font-black text-slate-900 tracking-tight italic">
                Activity
              </CardTitle>
              <CardDescription>
                Curriculum imports vs runtime anomalies (7-day window)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors"
              >
                Imports
              </Badge>
              <Badge
                variant="outline"
                className="bg-rose-50 text-rose-700 border-rose-100 font-bold group-hover:bg-rose-600 group-hover:text-white transition-colors"
              >
                Errors
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorImports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    }}
                    itemStyle={{ color: '#1e293b' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="imports"
                    stroke="#6366f1"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorImports)"
                  />
                  <Area
                    type="monotone"
                    dataKey="errors"
                    stroke="#f43f5e"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorErrors)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Distribution Pie — uses real question type data */}
        <Card className="border-white/40 shadow-xl shadow-purple-500/5 bg-white/60 backdrop-blur-xl group">
          <CardHeader>
            <CardTitle className="text-xl font-black text-slate-900 tracking-tight italic">
              Question Types
            </CardTitle>
            <CardDescription>Question type distribution</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                <PieChart>
                  <Pie
                    data={aiUsageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {aiUsageData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    }}
                    itemStyle={{ color: '#1e293b' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full mt-4">
              {aiUsageData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-2xs font-black uppercase text-slate-500 truncate">
                    {d.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-indigo-100 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900 text-base">
              <Database className="w-5 h-5" />
              Curriculum Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <RegistryItem label="Domains" value={String(stats?.domains || 0)} status="Active" />
              <RegistryItem label="Skills" value={String(stats?.skills || 0)} status="Active" />
              <RegistryItem
                label="Questions"
                value={String(stats?.questions || 0)}
                status="Active"
              />
            </ul>
          </CardContent>
        </Card>

        <Card className="border-purple-100 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900 text-base">
              <BrainCircuit className="w-5 h-5" />
              Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <RegistryItem
                label="Errors (24h)"
                value={String(stats?.errors24h || 0)}
                status={(stats?.errors24h || 0) === 0 ? 'Healthy' : 'Review'}
              />
              <RegistryItem
                label="Question Types"
                value={String(stats?.questionDistribution?.length || 0)}
                status="Active"
              />
              <RegistryItem label="Database" value="QuesterixDB-v2" status="Connected" />
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  color,
  isLoading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend: string;
  trendUp: boolean;
  color: 'indigo' | 'purple' | 'rose' | 'blue';
  isLoading: boolean;
}) {
  const colors = {
    indigo: 'from-indigo-500 to-blue-600 text-indigo-600 bg-indigo-50',
    purple: 'from-purple-500 to-indigo-600 text-purple-600 bg-purple-50',
    rose: 'from-rose-500 to-pink-600 text-rose-600 bg-rose-50',
    blue: 'from-blue-500 to-cyan-600 text-blue-600 bg-blue-50',
  };

  return (
    <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 group hover:scale-[1.02] transition-transform duration-500">
      <div
        className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${colors[color].split(' ').slice(0, 2).join(' ')}`}
      />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div
            className={`p-3 rounded-2xl ${colors[color].split(' ').slice(3).join(' ')} mb-4 transition-transform group-hover:scale-110`}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div
            className={`flex items-center gap-1 text-2xs font-black uppercase tracking-widest ${trendUp ? 'text-emerald-700' : 'text-rose-600'}`}
          >
            {trendUp ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {trend}
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-black text-slate-900 font-mono tracking-tighter mb-1">
            {isLoading ? '...' : typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          <p className="text-2xs font-black text-slate-600 uppercase tracking-extra-wide italic">
            {title}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function RegistryItem({ label, value, status }: { label: string; value: string; status: string }) {
  return (
    <li className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100/50">
      <div>
        <p className="text-2xs font-black text-gray-600 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-900">{value}</p>
      </div>
      <Badge
        variant="outline"
        className="bg-white text-emerald-700 border-emerald-100 text-2xs font-bold"
      >
        {status}
      </Badge>
    </li>
  );
}
