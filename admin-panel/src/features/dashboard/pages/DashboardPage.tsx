import React from 'react';
import { 
  BookOpen, AlertCircle, 
  BrainCircuit, Activity, Layers,
  ArrowUpRight, ArrowDownRight, Database
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area,
  Cell, PieChart, Pie
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AdminHeader } from '@/components/ui/admin-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e'];

export function DashboardPage() {
  const { currentApp } = useApp();

  // Fetch Global Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', currentApp?.app_id],
    queryFn: async () => {
      const results = await Promise.all([
        supabase.from('domains').select('id', { count: 'exact', head: true }).eq('app_id', currentApp?.app_id || ''),
        supabase.from('skills').select('id', { count: 'exact', head: true }).eq('app_id', currentApp?.app_id || ''),
        supabase.from('questions').select('id', { count: 'exact', head: true }).eq('app_id', currentApp?.app_id || ''),
        supabase.from('error_logs').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('ai_generation_sessions').select('token_count, questions_generated').eq('status', 'approved')
      ]);

      return {
        domains: results[0].count || 0,
        skills: results[1].count || 0,
        questions: results[2].count || 0,
        errors24h: results[3].count || 0,
        aiSessions: results[4].data || []
      };
    },
    enabled: Boolean(currentApp)
  });

  // Mock data for charts
  const activityData = [
    { name: 'Mon', imports: 40, errors: 24 },
    { name: 'Tue', imports: 30, errors: 13 },
    { name: 'Wed', imports: 20, errors: 98 },
    { name: 'Thu', imports: 27, errors: 39 },
    { name: 'Fri', imports: 18, errors: 48 },
    { name: 'Sat', imports: 23, errors: 38 },
    { name: 'Sun', imports: 34, errors: 43 },
  ];

  const aiUsageData = [
    { name: 'MCQ', value: 450 },
    { name: 'Boolean', value: 300 },
    { name: 'Input', value: 200 },
    { name: 'Other', value: 80 },
  ];

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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <AdminHeader 
        title="Command Center"
        description="Real-time curriculum intelligence and platform stability matrix."
        icon={Activity}
      />

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Question Bank" 
          value={stats?.questions || 0} 
          icon={BookOpen} 
          trend="+12%" 
          trendUp={true}
          color="indigo"
          isLoading={statsLoading}
        />
        <StatCard 
          title="Active Skills" 
          value={stats?.skills || 0} 
          icon={BrainCircuit} 
          trend="+5" 
          trendUp={true}
          color="purple"
          isLoading={statsLoading}
        />
        <StatCard 
          title="Stability (24h)" 
          value={stats?.errors24h || 0} 
          icon={AlertCircle} 
          trend="-15%" 
          trendUp={false}
          color="rose"
          isLoading={statsLoading}
        />
        <StatCard 
          title="App Coverage" 
          value={stats?.domains || 0} 
          icon={Layers} 
          trend="Stable" 
          trendUp={true}
          color="blue"
          isLoading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Activity Chart */}
        <Card className="lg:col-span-2 border-white/40 shadow-xl shadow-indigo-500/5 bg-white/60 backdrop-blur-xl overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div>
              <CardTitle className="text-xl font-black text-slate-900 tracking-tight italic">Platform Velocity</CardTitle>
              <CardDescription>Curriculum imports vs runtime anomalies (7-day window)</CardDescription>
            </div>
            <div className="flex items-center gap-2">
               <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">Imports</Badge>
               <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-100 font-bold group-hover:bg-rose-600 group-hover:text-white transition-colors">Errors</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorImports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                    itemStyle={{color: '#1e293b'}}
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

        {/* AI Distribution Pie */}
        <Card className="border-white/40 shadow-xl shadow-purple-500/5 bg-white/60 backdrop-blur-xl group">
             <CardHeader>
                <CardTitle className="text-xl font-black text-slate-900 tracking-tight italic">Content DNA</CardTitle>
                <CardDescription>AI-generated question distribution</CardDescription>
             </CardHeader>
             <CardContent className="flex flex-col items-center">
                <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
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
                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                                itemStyle={{color: '#1e293b'}}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                    {aiUsageData.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                            <span className="text-[10px] font-black uppercase text-slate-500 truncate">{d.name}</span>
                        </div>
                    ))}
                </div>
             </CardContent>
        </Card>
      </div>

      {/* AI Performance Registry Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-indigo-100 shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-900 text-base">
                    <Database className="w-5 h-5" />
                    Oracle Registry Health
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    <RegistryItem label="Semantic Chunks" value="742" status="Synced" />
                    <RegistryItem label="RAG Coverage" value="98.2%" status="Optimized" />
                    <RegistryItem label="Sync Latency" value="1.2s" status="Good" />
                </ul>
            </CardContent>
        </Card>

        <Card className="border-purple-100 shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900 text-base">
                    <BrainCircuit className="w-5 h-5" />
                    AI Governance Report
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    <RegistryItem label="Avg Generation Time" value="4.8s" status="Stable" />
                    <RegistryItem label="Validation Rate" value="94.1%" status="High" />
                    <RegistryItem label="Cost per Unit" value="$0.002" status="Optimal" />
                </ul>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendUp, color, isLoading }: {
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
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${colors[color].split(' ').slice(0, 2).join(' ')}`} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-2xl ${colors[color].split(' ').slice(3).join(' ')} mb-4 transition-transform group-hover:scale-110`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${trendUp ? 'text-emerald-700' : 'text-rose-600'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-black text-slate-900 font-mono tracking-tighter mb-1">
            {isLoading ? '...' : (typeof value === 'number' ? value.toLocaleString() : value)}
          </h3>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RegistryItem({ label, value, status }: { label: string; value: string; status: string }) {
    return (
        <li className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100/50">
            <div>
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-bold text-slate-900">{value}</p>
            </div>
            <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-100 text-[10px] font-bold">
                {status}
            </Badge>
        </li>
    );
}
