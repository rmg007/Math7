import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, Coins, CheckCircle, AlertTriangle, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TenantQuota {
  app_id: string;
  display_name: string;
  monthly_token_limit: number;
  current_token_usage: number;
  is_throttled: boolean;
  updated_at: string;
}

export const GovernancePage: React.FC = () => {
  const [quotas, setQuotas] = useState<TenantQuota[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchQuotas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchQuotas = async () => {
    setIsLoading(true);
    try {
      // Joined query to get app names and quotas
      // Note: tenant_quotas table types will be available after regenerating database.types.ts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('tenant_quotas')
        .select(`
          app_id,
          monthly_token_limit,
          current_token_usage,
          is_throttled,
          updated_at,
          apps!inner (
            display_name
          )
        `);

      if (error) throw error;

       
      const formattedData = data.map((q: { app_id: string; monthly_token_limit: number; current_token_usage: number; is_throttled: boolean; updated_at: string; apps: { display_name: string } }) => ({
        app_id: q.app_id,
        display_name: q.apps.display_name,
        monthly_token_limit: q.monthly_token_limit,
        current_token_usage: q.current_token_usage,
        is_throttled: q.is_throttled,
        updated_at: q.updated_at
      }));

      setQuotas(formattedData);
    } catch (err) {
      console.error('Failed to fetch quotas:', err);
      toast({
        title: 'Error',
        description: 'Failed to load governance data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQuotas = quotas.filter(q => 
    q.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Monitor AI resource allocation, content quality standards, and token consumption across all tenants.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-300/60 mb-1">Total Consumption</p>
            <p className="text-2xl font-bold">
              {quotas.reduce((acc, q) => acc + q.current_token_usage, 0).toLocaleString()}
            </p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-300/60 mb-1">Active Tenants</p>
            <p className="text-2xl font-bold">{quotas.length}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Tenant Quotas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Tenant Resource Allocation</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tenants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-gray-500">Loading quota data...</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredQuotas.map((quota) => {
                  const usagePercent = (quota.current_token_usage / quota.monthly_token_limit) * 100;
                  return (
                    <div key={quota.app_id} className="p-6 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-gray-900">{quota.display_name}</h3>
                          <code className="text-[10px] text-gray-400 uppercase tracking-tighter">{quota.app_id}</code>
                        </div>
                        <div className="flex items-center gap-3">
                          {quota.is_throttled && (
                            <span className="flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase">
                              <AlertTriangle className="w-3 h-3" />
                              Throttled
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">
                            <Coins className="w-3 h-3" />
                            Active Quota
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500 uppercase font-bold tracking-widest">Global AI Tokens</span>
                          <span className="font-mono">
                            {quota.current_token_usage.toLocaleString()} / {quota.monthly_token_limit.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-inner">
                          <div 
                            className={`h-full transition-all duration-1000 ${
                              usagePercent > 90 ? 'bg-red-500' : usagePercent > 75 ? 'bg-amber-400' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                            }`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Governance Status */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Sovereignty Status
            </h2>
            <div className="space-y-4">
              <GovernanceCheckItem 
                label="Cross-Model Verification" 
                status="active" 
                desc="Gemini Pro 1.5 auditing Flash outputs"
              />
              <GovernanceCheckItem 
                label="Shadow Deduplication" 
                status="active" 
                desc="Preventing redundant content generation"
              />
              <GovernanceCheckItem 
                label="Atomic Token Budgeting" 
                status="active" 
                desc="Enforced via PL/pgSQL RPC triggers"
              />
              <GovernanceCheckItem 
                label="PII Sanitization" 
                status="monitored" 
                desc="Edge function scrubbing in review"
              />
            </div>
            
            <button className="w-full mt-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold text-sm rounded-lg border border-gray-200 transition-colors">
              Update Validation Rules
            </button>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 shadow-inner">
            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-widest mb-2">Security Note</h3>
            <p className="text-sm text-indigo-800 leading-relaxed">
              All AI generation requests are audited against the **Content Sovereignty Protocol**.
              Direct model access is disabled; all requests must pass through the **Governance Bridge**.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

const GovernanceCheckItem: React.FC<{ label: string; status: 'active' | 'monitored' | 'disabled'; desc: string }> = ({ 
  label, status, desc 
}) => (
  <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
    <div className={`mt-1 w-2 h-2 rounded-full ${
      status === 'active' ? 'bg-green-500' : status === 'monitored' ? 'bg-blue-400' : 'bg-gray-300'
    }`} />
    <div>
      <p className="text-sm font-bold text-gray-900 leading-none mb-1">{label}</p>
      <p className="text-[11px] text-gray-500 leading-tight">{desc}</p>
    </div>
  </div>
);
