import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, DollarSign, FileText, AlertCircle } from 'lucide-react';

import { Database } from '@/lib/database.types';
import { AdminHeader } from '@/components/ui/admin-header';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type GenerationSession = Database['public']['Tables']['ai_generation_sessions']['Row'];

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003 }, // per 1k tokens
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
};

export const SessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<GenerationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      case 'imported': return 'completed' as StatusType; // 'completed' is not in StatusType but it defaults correctly
      case 'rejected': return 'exhausted';
      default: return 'pending';
    }
  };

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
    <div className="space-y-8">
      <AdminHeader 
        title="AI Generation History"
        description="Track and audit AI question generation sessions, token consumption, and model efficiency across applications."
        icon={Clock}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-purple-100 shadow-sm shadow-purple-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 border-none uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                Total Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 font-mono tracking-tight">{totalQuestionsGenerated}</p>
            <p className="text-[10px] text-gray-500 mt-1 uppercase font-medium">{sessions.length} sessions executed</p>
          </CardContent>
        </Card>

        <Card className="border-green-100 shadow-sm shadow-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 border-none uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-green-600" />
                Imported questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 font-mono tracking-tight">{totalQuestionsImported}</p>
            <p className="text-[10px] text-green-600 mt-1 uppercase font-medium">
              {totalQuestionsGenerated > 0
                ? `${((totalQuestionsImported / totalQuestionsGenerated) * 100).toFixed(1)}% Conversion rate`
                : 'Insufficient data'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm shadow-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 border-none uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                Total Estimated Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 font-mono tracking-tight">${totalCost.toFixed(3)}</p>
            <p className="text-[10px] text-blue-600 mt-1 uppercase font-medium font-mono">
              ~${(totalCost / totalQuestionsGenerated || 0).toFixed(6)} / Q
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-100 shadow-sm shadow-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 border-none uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
                Avg Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 font-mono tracking-tight">
              {sessions.length > 0
                ? (sessions.reduce((sum, s) => sum + (s.generation_time_ms || 0), 0) / sessions.length / 1000).toFixed(1)
                : 0}s
            </p>
            <p className="text-[10px] text-orange-600 mt-1 uppercase font-medium">Generation time / session</p>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Generated
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Imported
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(session.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{session.model_used}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium">
                    {session.questions_generated}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium">
                    {session.questions_imported}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">
                    {((session.generation_time_ms || 0) / 1000).toFixed(2)}s
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700 font-medium">
                    ${calculateCost(session).toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-center">
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

        {sessions.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No generation sessions yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first session to see it here</p>
          </div>
        )}
      </div>
    </div>
  );
};
