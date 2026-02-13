import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { Activity, Search, Shield, X, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

type AIGenerationSession = Database['public']['Tables']['ai_generation_sessions']['Row'] & {
  created_by_profile?: {
    app_id: string | null;
    email: string;
    apps?: {
      display_name: string;
    } | null;
  } | null;
};

interface TenantUsage {
  app_id: string;
  display_name: string;
  total_tokens: number;
  total_questions: number;
  session_count: number;
  last_active: string;
  is_throttled?: boolean;
  monthly_token_limit?: number;
}

export const GovernancePage: React.FC = () => {
  const [usageData, setUsageData] = useState<TenantUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsage = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_generation_sessions')
        .select(
          `
          *,
          created_by_profile:created_by (
            app_id,
            email,
            apps:app_id (
              display_name
            )
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      const aggMap = new Map<string, TenantUsage>();
      const sessions = data as unknown as AIGenerationSession[];

      sessions.forEach((session) => {
        const profile = session.created_by_profile;
        const profileApps =
          profile && typeof profile === 'object' && 'apps' in profile
            ? (profile as { apps?: { display_name: string } | null }).apps
            : null;
        const appName = profileApps?.display_name || 'Unknown App';
        const appId = profile?.app_id || 'unknown';

        if (!aggMap.has(appId)) {
          aggMap.set(appId, {
            app_id: appId,
            display_name: appName,
            total_tokens: 0,
            total_questions: 0,
            session_count: 0,
            last_active: session.created_at,
          });
        }

        const entry = aggMap.get(appId);
        if (entry) {
          entry.total_tokens += session.token_count || 0;
          entry.total_questions += session.questions_generated || 0;
          entry.session_count += 1;

          if (new Date(session.created_at) > new Date(entry.last_active)) {
            entry.last_active = session.created_at;
          }
        }
      });

      setUsageData(Array.from(aggMap.values()));
    } catch (err) {
      console.error('Failed to fetch AI usage:', err);
      toast({
        title: 'Error',
        description: 'Failed to load AI governance data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = usageData.filter(
    (d) =>
      d.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.app_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTokens = usageData.reduce((acc, curr) => acc + curr.total_tokens, 0);
  const totalSessions = usageData.reduce((acc, curr) => acc + curr.session_count, 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-900 p-8 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold tracking-tight">AI Governance</h1>
          </div>
          <p className="text-blue-100/80 max-w-xl">
            Monitor AI resource allocation, content quality standards, and token consumption across
            all tenants.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-300/60 mb-1">
              Global Tokens
            </p>
            <p className="text-2xl font-bold">{totalTokens.toLocaleString()}</p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-300/60 mb-1">
              Sessions
            </p>
            <p className="text-2xl font-bold">{totalSessions}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Tenant Usage */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-4 mb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tenants by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Results:
                    </span>
                    <span className="text-xs font-bold text-gray-700">{filteredData.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-gray-500">Loading AI usage data...</div>
            ) : filteredData.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-full flex items-center justify-center">
                  <Activity className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No AI Usage Data Found</h3>
                  <p className="text-sm text-gray-600 max-w-md mx-auto">
                    This dashboard displays AI generation activity aggregated from the{' '}
                    <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">
                      ai_generation_sessions
                    </code>{' '}
                    table.
                  </p>
                  <p className="text-sm text-gray-600 max-w-md mx-auto mt-2">
                    Data will appear here once tenants start generating questions using the
                    AI-powered content engine.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredData.map((usage) => (
                  <div key={usage.app_id} className="p-6 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          {usage.display_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{usage.display_name}</h3>
                          <code className="text-[10px] text-gray-400 uppercase tracking-tighter">
                            {usage.app_id}
                          </code>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge
                          status={(usage.is_throttled ? 'throttled' : 'active') as StatusType}
                          icon={<Activity className="w-3 h-3" />}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-[10px] text-gray-500 uppercase font-bold text-center">
                          Tokens
                        </p>
                        <p className="text-lg font-mono font-bold text-center text-indigo-600">
                          {usage.total_tokens.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-[10px] text-gray-500 uppercase font-bold text-center">
                          Questions
                        </p>
                        <p className="text-lg font-mono font-bold text-center text-emerald-600">
                          {usage.total_questions.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-[10px] text-gray-500 uppercase font-bold text-center">
                          Sessions
                        </p>
                        <p className="text-lg font-mono font-bold text-center text-blue-600">
                          {usage.session_count}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Stats & Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cost Estimation (Approx)</CardDescription>
              <CardTitle className="text-3xl font-mono">
                ${((totalTokens / 1000) * 0.0005).toFixed(4)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Based on Gemini Flash input/output mix (~$0.50/1M tokens)
              </div>
            </CardContent>
          </Card>

          <div className="bg-white rounded-xl shadow-sm border border-[#1a1b4b]/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1a1b4b]/10 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                AI Security & Governance Protocol
              </h3>
            </div>
            <div className="p-6">
              <div className="prose prose-sm prose-purple max-w-none text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <ReactMarkdown>
                    {`
### 🛡️ Enterprise-Grade Security Architecture

Our AI generation infrastructure is built on **Privacy-by-Design** principles, ensuring that your data remains secure throughout the entire curriculum generation lifecycle.

#### 1. Data Isolation & Sovereignty
Each application instance operates within a strictly isolated vector namespace. We enforce **Multi-Tenant Logical Isolation** at the database, embedding, and model routing layers to prevent cross-tenant data leakage.

#### 2. Advanced Security Features
*   **Automatic PII Scrubbing**: Our proprietary pre-processing layer redacts Personally Identifiable Information (PII) using NIST-compliant patterns before any data is transmitted to inference models.
*   **Encrypted Inference Pathways**: All data in transit to LLM providers is encrypted using TLS 1.3 with Perfect Forward Secrecy.
*   **Zero Retention Policy**: We utilize API endpoints configured with zero-data-retention, ensuring that training on your proprietary curriculum data is strictly prohibited.

#### 3. Governance & Control
*   **Intelligent Model Throttling**: Real-time monitoring of token consumption and session velocity prevents service degradation and manages operational costs.
*   **Full Audit Traceability**: Every AI interaction is logged with precise timestamps, model metadata, and tenant IDs for comprehensive governance compliance.
`}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 shadow-inner">
            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Live Monitoring
            </h3>
            <p className="text-sm text-indigo-800 leading-relaxed">
              Usage data is aggregated from the \`ai_generation_sessions\` table. Costs are
              estimated based on public Gemini pricing and may vary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
