import { Zap } from 'lucide-react';

interface GovernanceInfoProps {
  tokensConsumed: number;
  quotaRemaining: number;
}

export function GovernanceInfo({ tokensConsumed, quotaRemaining }: GovernanceInfoProps) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
      <div
        className="glass-card p-5 border-0 shadow-lg shadow-purple-500/5"
        role="region"
        aria-label="Usage and Quota"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Daily Usage
            </h4>
            <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-mono">
              {tokensConsumed.toLocaleString()}
            </p>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg">
            <Zap className="w-4 h-4 text-purple-600" aria-hidden="true" />
          </div>
        </div>
        <div className="space-y-1.5" aria-live="polite">
          <div className="flex justify-between text-[10px] font-medium text-gray-500">
            <span>Quota Remaining</span>
            <span className="text-purple-600">{quotaRemaining.toLocaleString()} tokens</span>
          </div>
          <div
            className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden"
            role="progressbar"
            aria-label="Token usage"
            aria-valuenow={tokensConsumed}
            aria-valuemin={0}
            aria-valuemax={tokensConsumed + quotaRemaining}
          >
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min(100, (tokensConsumed / (tokensConsumed + quotaRemaining)) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
