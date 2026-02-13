import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle2, Clock, DollarSign, FileText, Search, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { AdminHeader } from '@/components/ui/admin-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { Database } from '@/lib/database.types';

type GenerationSession = Database['public']['Tables']['ai_generation_sessions']['Row'];

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003 }, // per 1k tokens
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
};

export const SessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<GenerationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_generation_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = (session: GenerationSession): number => {
    const pricing = MODEL_PRICING[session.model_used] || MODEL_PRICING['gemini-1.5-flash'];
    const tokensInThousands = (session.token_count || 0) / 1000;
    // Assume 50/50 split input/output for simplicity
    const estimatedCost =
      (tokensInThousands * 0.5 * pricing.input) + (tokensInThousands * 0.5 * pricing.output);
    return estimatedCost;
  };

  const totalCost = sessions.reduce((sum, session) => sum + calculateCost(session), 0);
  const totalQuestionsGenerated = sessions.reduce((sum, s) => sum + (s.questions_generated || 0), 0);
  const totalQuestionsImported = sessions.reduce((sum, s) => sum + (s.questions_imported || 0), 0);

  const getStatusType = (status: string | null): StatusType => {
    if (!status) return 'pending';
    switch (status.toLowerCase()) {
      case 'reviewing': return 'pending';
      case 'approved': return 'resolved';
      case 'imported': return 'published';
      case 'rejected': return 'exhausted';
      default: return 'pending';
    }
  };

  const filteredSessions = sessions.filter(session => {
    return session.model_used.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.status?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Sessions</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
      <AdminHeader 
        title="Intelligence Telemetry"
        description="Track and audit AI generation sessions, token consumption, and model efficiency."
        icon={Clock}
        breadcrumbs={[
          { label: 'Platform', href: '/platform/apps' },
          { label: 'Intelligence', href: '/ai-sessions' },
          { label: 'Telemetry', href: '/ai-sessions' }
        ]}
      />

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white/20 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/10 group-hover:scale-110 transition-transform">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Artifacts</p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mt-1">{totalQuestionsGenerated}</h3>
            </div>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 w-[70%]" />
          </div>
          <p className="text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-widest">{sessions.length} sessions executed</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white/20 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/10 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Import Rate</p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mt-1">
                {totalQuestionsGenerated > 0
                  ? `${((totalQuestionsImported / totalQuestionsGenerated) * 100).toFixed(1)}%`
                  : '0%'}
              </h3>
            </div>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500" 
              style={{ width: `${totalQuestionsGenerated > 0 ? (totalQuestionsImported / totalQuestionsGenerated) * 100 : 0}%` }} 
            />
          </div>
          <p className="text-[10px] text-emerald-600 mt-3 font-bold uppercase tracking-widest">{totalQuestionsImported} synced to production</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white/20 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/10 group-hover:scale-110 transition-transform">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Compute Cost</p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mt-1">${totalCost.toFixed(3)}</h3>
            </div>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[45%]" />
          </div>
          <p className="text-[10px] text-blue-600 mt-3 font-bold uppercase tracking-widest">~${(totalCost / totalQuestionsGenerated || 0).toFixed(4)} Per Question</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white/20 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/10 group-hover:scale-110 transition-transform">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Avg Latency</p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mt-1">
                {sessions.length > 0
                  ? (sessions.reduce((sum, s) => sum + (s.generation_time_ms || 0), 0) / sessions.length / 1000).toFixed(1)
                  : 0}s
              </h3>
            </div>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 w-[60%]" />
          </div>
          <p className="text-[10px] text-orange-600 mt-3 font-bold uppercase tracking-widest">Generation Velocity</p>
        </div>
      </div>

      {/* Intelligence Filter Bar */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/20 p-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search telemetry by model or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-100 bg-white/50 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/10 rounded-xl flex items-center gap-2">
             <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Sessions:</span>
             <span className="text-sm font-black text-indigo-700 tracking-tight">{filteredSessions.length} TRACKED</span>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-500">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30">
          <h3 className="text-xl font-black text-gray-900 tracking-tight italic">Execution Archive</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 italic">Historical Generation Events</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 hover:bg-gray-50/50 border-b-2 border-gray-100">
                <th className="px-8 py-4 text-left font-black text-[10px] uppercase tracking-widest text-gray-400">Date</th>
                <th className="px-4 py-4 text-left font-black text-[10px] uppercase tracking-widest text-gray-400">Model Node</th>
                <th className="px-4 py-4 text-center font-black text-[10px] uppercase tracking-widest text-gray-400">Artifacts</th>
                <th className="px-4 py-4 text-center font-black text-[10px] uppercase tracking-widest text-gray-400">Synced</th>
                <th className="px-4 py-4 text-right font-black text-[10px] uppercase tracking-widest text-gray-400">Latency</th>
                <th className="px-4 py-4 text-right font-black text-[10px] uppercase tracking-widest text-gray-400">Cost</th>
                <th className="px-8 py-4 text-center font-black text-[10px] uppercase tracking-widest text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 tracking-tight italic">
                        {new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-5 font-bold text-gray-700 text-sm truncate max-w-[150px] italic">
                    {session.model_used}
                  </td>
                  <td className="px-4 py-5 text-center">
                    <span className="px-3 py-1 rounded-full bg-gray-100 font-mono font-black text-gray-900 text-xs shadow-sm">
                      {session.questions_generated}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-center">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 font-mono font-black text-emerald-700 text-xs shadow-sm">
                      {session.questions_imported}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-right font-bold text-gray-500 text-xs">
                    {((session.generation_time_ms || 0) / 1000).toFixed(2)}s
                  </td>
                  <td className="px-4 py-5 text-right font-mono font-black text-blue-600 text-xs">
                    ${calculateCost(session).toFixed(4)}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <StatusBadge 
                      status={getStatusType(session.status)} 
                      label={(session.status || 'reviewing').toUpperCase()}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSessions.length === 0 && (
          <div className="py-24">
            <EmptyState 
              icon={Clock}
              title="No Telemetry Detected"
              description="Generation events will materialize here once the AI engine is engaged."
            />
          </div>
        )}
      </div>
    </div>
  );
};
