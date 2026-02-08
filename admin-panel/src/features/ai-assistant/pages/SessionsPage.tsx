import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, DollarSign, FileText, AlertCircle } from 'lucide-react';

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

  const getStatusBadgeColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'imported':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Generation History
        </h1>
        <p className="text-gray-600">
          Track AI question generation sessions, costs, and import status
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-700">Total Generated</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalQuestionsGenerated}</p>
          <p className="text-xs text-gray-500 mt-1">{sessions.length} sessions</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-700">Imported</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalQuestionsImported}</p>
          <p className="text-xs text-gray-500 mt-1">
            {totalQuestionsGenerated > 0
              ? `${((totalQuestionsImported / totalQuestionsGenerated) * 100).toFixed(1)}% approval`
              : 'No data'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-700">Total Cost</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">${totalCost.toFixed(4)}</p>
          <p className="text-xs text-gray-500 mt-1">
            ~${(totalCost / totalQuestionsGenerated || 0).toFixed(6)} per question
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <h3 className="text-sm font-semibold text-gray-700">Avg Time</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {sessions.length > 0
              ? (sessions.reduce((sum, s) => sum + (s.generation_time_ms || 0), 0) / sessions.length / 1000).toFixed(1)
              : 0}s
          </p>
          <p className="text-xs text-gray-500 mt-1">per session</p>
        </div>
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
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(
                        session.status
                      )}`}
                    >
                      {(session.status || 'reviewing').toUpperCase()}
                    </span>
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
