import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ValidationSummary {
  status: string;
  summary: string;
  overall_score: number;
  findings: Array<{ question_id: number; issues: string[] }>;
}

interface QualityAuditModuleProps {
  validationSummary: ValidationSummary;
}

export function QualityAuditModule({ validationSummary }: QualityAuditModuleProps) {
  return (
    <div
      role="region"
      aria-label="Quality audit results"
      className={cn(
        'p-6 rounded-3xl border animate-in slide-in-from-top-4 duration-500 relative overflow-hidden',
        validationSummary.status === 'approved'
          ? 'bg-emerald-50/30 border-emerald-100/50'
          : 'bg-amber-50/30 border-amber-100/50 text-amber-900'
      )}
    >
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-xl',
              validationSummary.status === 'approved'
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-amber-100 text-amber-600'
            )}
            aria-hidden="true"
          >
            {validationSummary.status === 'approved' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-gray-900">AI Content Audit</h3>
            <p className="text-xs opacity-70 text-gray-500 font-medium">
              Automated quality evaluation results
            </p>
          </div>
        </div>
        <div className="text-right">
          <span
            className={cn(
              'text-2xl font-black font-mono leading-none',
              validationSummary.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'
            )}
            aria-label={`Quality score: ${(validationSummary.overall_score * 100).toFixed(0)} percent`}
          >
            {(validationSummary.overall_score * 100).toFixed(0)}%
          </span>
          <p className="text-[10px] uppercase font-bold tracking-widest opacity-50">
            Confidence Score
          </p>
        </div>
      </div>
      <div
        className="prose prose-sm max-w-none text-gray-700 text-xs leading-relaxed relative z-10 bg-white/40 p-4 rounded-xl backdrop-blur-sm mt-4 italic font-medium"
        aria-live="polite"
      >
        <ReactMarkdown>{validationSummary.summary}</ReactMarkdown>
      </div>
    </div>
  );
}
