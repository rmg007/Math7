import type { AnalystResults, HistoryRecord, SurfaceMap, TestResults } from '../types'

interface HeroProps {
  testResults: Record<string, TestResults>
  surfaceMap: SurfaceMap | null
  analystResults: AnalystResults | null
  history: HistoryRecord[]
  smokePass: boolean
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">{label}</div>
    </div>
  )
}

export function Hero({ testResults, surfaceMap, analystResults, smokePass }: HeroProps) {
  const allResults = Object.values(testResults)
  const passed = allResults.filter(r => r.status === 'passed').length
  const failed = allResults.filter(r => r.status === 'failed').length
  const total = allResults.length
  const score = total > 0 ? Math.round((passed / total) * 100) : 0

  const totalGaps = surfaceMap?.gaps?.length || 0
  const bundleSize = analystResults?.bundleSize || 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <StatCard
          value={total > 0 ? `${score}/100` : '-'}
          label="Score"
          color="text-cyan-400"
        />
        <StatCard
          value={total > 0 ? String(passed) : '-'}
          label="Passed"
          color="text-emerald-400"
        />
        <StatCard
          value={total > 0 ? String(failed) : '-'}
          label="Failed"
          color="text-red-400"
        />
        <StatCard
          value={bundleSize ? `${bundleSize} KB` : '-'}
          label="Bundle"
          color="text-violet-400"
        />
        <StatCard
          value={totalGaps > 0 ? String(totalGaps) : '0'}
          label="Coverage Gaps"
          color={totalGaps > 0 ? 'text-orange-400' : 'text-emerald-400'}
        />
        <StatCard
          value={smokePass ? 'Open' : 'Locked'}
          label="Smoke Gate"
          color={smokePass ? 'text-emerald-400' : 'text-red-400'}
        />
      </div>

      {total > 0 && (allResults.some(r => r.status === 'running')) && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            <span>Executing Suites...</span>
            <span>{Math.round((passed + failed) / total * 100)}%</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-cyan-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)]"
              style={{ width: `${Math.round((passed + failed) / total * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
