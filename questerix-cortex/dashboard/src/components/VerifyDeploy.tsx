import {
    AlertTriangle,
    CheckCircle,
    CheckSquare,
    Clock,
    Globe,
    History,
    Loader2,
    RefreshCw,
    ServerCrash,
    ShieldCheck,
    Square,
    XCircle,
} from 'lucide-react'
import { useState } from 'react'
import type {
    SmokeCategoryId,
    SmokeCheckResult,
    VerifyDeployCompletePayload,
    VerifyDeployHistory,
    VerifyDeployProgressPayload,
} from '../types'

// ── Constants ─────────────────────────────────────────────────────────────────

const PRODUCTION_URL = 'https://admin.questerix.com'

const CATEGORY_META: Record<SmokeCategoryId, { icon: typeof Globe; label: string; color: string }> = {
  Infrastructure: { icon: ServerCrash, label: 'Infrastructure', color: 'text-violet-400' },
  Authentication: { icon: ShieldCheck, label: 'Authentication', color: 'text-cyan-400' },
  'Multi-Tenancy': { icon: Globe, label: 'Multi-Tenancy', color: 'text-amber-400' },
  'Supabase Connectivity': { icon: CheckSquare, label: 'Supabase', color: 'text-emerald-400' },
  'Admin Data Render': { icon: RefreshCw, label: 'Admin Data', color: 'text-pink-400' },
}

const ALL_CATEGORIES: SmokeCategoryId[] = [
  'Infrastructure',
  'Authentication',
  'Multi-Tenancy',
  'Supabase Connectivity',
  'Admin Data Render',
]

// ── Props ──────────────────────────────────────────────────────────────────────

interface VerifyDeployProps {
  onVerifyDeploy: (targetUrl: string) => void
  progress: VerifyDeployProgressPayload | null
  lastResult: VerifyDeployCompletePayload | null
  history: VerifyDeployHistory[]
  isRunning: boolean
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function CategoryRow({
  category,
  checks,
  isRunning,
}: {
  category: SmokeCategoryId
  checks: SmokeCheckResult[]
  isRunning: boolean
}) {
  const meta = CATEGORY_META[category]
  const Icon = meta.icon
  const categoryChecks = checks.filter(c => c.category === category)
  const passed = categoryChecks.filter(c => c.passed).length
  const total = categoryChecks.length

  const statusIcon =
    isRunning && total === 0 ? (
      <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
    ) : total === 0 ? (
      <Square className="w-3.5 h-3.5 text-slate-600" />
    ) : passed === total ? (
      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
    ) : (
      <XCircle className="w-3.5 h-3.5 text-red-400" />
    )

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
        <span className={`flex items-center gap-2 text-sm font-semibold ${meta.color}`}>
          <Icon className="w-3.5 h-3.5" />
          {meta.label}
        </span>
        <span className="flex items-center gap-1.5">
          {total > 0 && (
            <span className="text-[11px] text-slate-500">
              {passed}/{total}
            </span>
          )}
          {statusIcon}
        </span>
      </div>
      {categoryChecks.map((check, i) => (
        <div
          key={i}
          className="flex items-start gap-2 pl-4 py-0.5"
        >
          {check.passed ? (
            <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
          ) : (
            <XCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <span className={`text-xs ${check.passed ? 'text-slate-300' : 'text-red-300'}`}>
              {check.name}
            </span>
            {check.detail && (
              <div className="text-[10px] text-red-400/80 mt-0.5 font-mono truncate">
                {check.detail.slice(0, 120)}
              </div>
            )}
          </div>
          {check.durationMs !== undefined && check.durationMs > 0 && (
            <span className="text-[10px] text-slate-600 shrink-0">{(check.durationMs / 1000).toFixed(1)}s</span>
          )}
        </div>
      ))}
    </div>
  )
}

function HistoryRow({ record }: { record: VerifyDeployHistory }) {
  const ts = new Date(record.timestamp)
  const formatted = ts.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  const pass = record.passed

  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
      {pass ? (
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-semibold truncate ${pass ? 'text-emerald-300' : 'text-red-300'}`}>
          {pass ? 'PASSED' : 'FAILED'} — {record.passedChecks}/{record.totalChecks} checks
        </div>
        <div className="text-[10px] text-slate-500 truncate">{record.targetUrl}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[10px] text-slate-400">{formatted}</div>
        <div className="text-[10px] text-slate-600">{(record.durationMs / 1000).toFixed(0)}s</div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function VerifyDeploy({
  onVerifyDeploy,
  progress,
  lastResult,
  history,
  isRunning,
}: VerifyDeployProps) {
  const [targetUrl, setTargetUrl] = useState(PRODUCTION_URL)
  const [showHistory, setShowHistory] = useState(false)

  const handleRun = () => {
    if (isRunning) return
    const url = targetUrl.trim() || PRODUCTION_URL
    onVerifyDeploy(url)
  }

  // Gather live checks: prefer progress checks, fall back to last result
  const liveChecks: SmokeCheckResult[] = isRunning
    ? (progress?.checks ?? [])
    : (lastResult?.result.checks ?? [])

  // If there's a latestCheck in progress, add it to the live list if not already present
  const latestCheck = progress?.latestCheck
  const allLiveChecks: SmokeCheckResult[] =
    latestCheck && isRunning
      ? [...liveChecks, latestCheck]
      : liveChecks

  const passedTotal = allLiveChecks.filter(c => c.passed).length
  const grandTotal = allLiveChecks.length

  const overallStatus: 'idle' | 'running' | 'passed' | 'failed' =
    isRunning
      ? 'running'
      : lastResult
        ? lastResult.result.passed ? 'passed' : 'failed'
        : 'idle'

  const lastVerified = history[0]
    ? new Date(history[0].timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
    : null

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 tracking-tight">Verify Deploy</h2>
            {overallStatus === 'running' && (
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-blue-400 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> Running
              </span>
            )}
            {overallStatus === 'passed' && (
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                <CheckCircle className="w-3 h-3" /> All Passed
              </span>
            )}
            {overallStatus === 'failed' && (
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-red-400">
                <AlertTriangle className="w-3 h-3" /> Failed
              </span>
            )}
          </div>

          {/* Last verified timestamp */}
          {lastVerified && (
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="w-3 h-3" />
              Last verified: {lastVerified}
            </div>
          )}
        </div>

        {/* URL input + button row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <input
              type="url"
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              placeholder={PRODUCTION_URL}
              disabled={isRunning}
              className="w-full bg-slate-800 border border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
            />
          </div>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white text-xs font-bold rounded-md transition-all shadow-lg shadow-cyan-900/30 whitespace-nowrap"
          >
            {isRunning ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running…</>
            ) : (
              <><ShieldCheck className="w-3.5 h-3.5" /> Verify Deploy</>
            )}
          </button>

          <button
            onClick={() => setShowHistory(h => !h)}
            className={`p-1.5 rounded-md border transition-colors ${showHistory ? 'border-cyan-600 text-cyan-400 bg-cyan-950/30' : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'}`}
            title="Show history"
          >
            <History className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Summary bar */}
        {grandTotal > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${passedTotal === grandTotal ? 'bg-emerald-500' : isRunning ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`}
                style={{ width: `${grandTotal > 0 ? Math.round((passedTotal / grandTotal) * 100) : 0}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 whitespace-nowrap">
              {passedTotal}/{grandTotal} passed
            </span>
          </div>
        )}
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="border-b border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Deploy History ({history.length})
            </span>
          </div>
          {history.length === 0 ? (
            <div className="text-xs text-slate-600 italic">No runs yet.</div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-0">
              {history.slice(0, 20).map(record => (
                <HistoryRow key={record.id} record={record} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results panel */}
      <div className="p-4">
        {overallStatus === 'idle' ? (
          <div className="text-center py-6 text-slate-600">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <div className="text-xs">Enter a URL and click <strong className="text-slate-400">Verify Deploy</strong> to run smoke checks.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {ALL_CATEGORIES.map(category => (
              <CategoryRow
                key={category}
                category={category}
                checks={allLiveChecks}
                isRunning={isRunning}
              />
            ))}

            {/* Error block */}
            {lastResult?.result.error && !isRunning && (
              <div className="mt-3 bg-red-950/30 border border-red-900/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-semibold text-red-300">Runner Error</span>
                </div>
                <pre className="text-[10px] text-red-400/80 font-mono whitespace-pre-wrap">
                  {lastResult.result.error.slice(0, 300)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
