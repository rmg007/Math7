import { AlertTriangle, CheckCircle, Database, FileText, Lock, Shield } from 'lucide-react'
import { useState } from 'react'
import type { DriftResult, RlsAuditResult, SurfaceMap, TestResults } from '../types'

interface DetailTabsProps {
  testResults: Record<string, TestResults>
  surfaceMap: SurfaceMap | null
  driftResult: DriftResult | null
  rlsResult: RlsAuditResult | null
}

type TabId = 'tests' | 'coverage' | 'schema' | 'security'

const card = 'bg-slate-900 border border-slate-800 rounded-xl p-4'
const sectionTitle = 'text-[11px] text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2'
const row = 'flex justify-between items-center py-1.5 border-b border-slate-800 last:border-0 text-sm'

export function DetailTabs({ testResults, surfaceMap, driftResult, rlsResult }: DetailTabsProps) {
  const tabs: Array<{ id: TabId; label: string; icon: typeof FileText }> = [
    { id: 'tests', label: 'Test Suites', icon: FileText },
    { id: 'coverage', label: 'Coverage Gaps', icon: FileText },
    { id: 'schema', label: 'Schema Drift', icon: Database },
    { id: 'security', label: 'RLS Audit', icon: Shield },
  ]

  const [activeTab, setActiveTab] = useState<TabId>('tests')

  const allResults = Object.values(testResults)
  const failedTests = allResults.filter(r => r.status === 'failed')
  const passedTests = allResults.filter(r => r.status === 'passed')
  const runningTests = allResults.filter(r => r.status === 'running')

  const untestedFiles = surfaceMap?.gaps || []
  const totalFiles = (surfaceMap?.hooks?.length || 0) + (surfaceMap?.pages?.length || 0)

  return (
    <div>
      <nav className="flex gap-1 mb-4 bg-slate-900/50 border border-slate-800 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
              activeTab === tab.id
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'tests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={card}>
            <div className={sectionTitle}>
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              Failed ({failedTests.length})
            </div>
            {failedTests.length === 0 ? (
              <div className="text-sm text-slate-600 italic">No failures</div>
            ) : (
              <div className="space-y-2">
                {failedTests.map((test, i) => (
                  <div key={i} className="bg-red-950/40 border border-red-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="font-semibold text-sm text-red-300">{test.name}</span>
                      {test.duration && <span className="text-[11px] text-slate-500 ml-auto">{test.duration.toFixed(1)}s</span>}
                    </div>
                    {test.output && (
                      <pre className="text-[11px] text-slate-400 bg-black/40 rounded p-2 mt-1 max-h-32 overflow-auto font-mono whitespace-pre-wrap">{test.output.slice(-500)}</pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={card}>
            <div className={sectionTitle}>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Passed ({passedTests.length})
            </div>
            <div className="space-y-1">
              {runningTests.map((test, i) => (
                <div key={`r-${i}`} className={`${row} animate-pulse`}>
                  <span className="text-blue-300">{test.name}</span>
                  <span className="text-[11px] font-bold text-blue-400 uppercase">running</span>
                </div>
              ))}
              {passedTests.map((test, i) => (
                <div key={i} className={row}>
                  <span className="text-slate-300">{test.name}</span>
                  <span className="text-[11px] text-slate-500">{test.duration?.toFixed(1)}s</span>
                </div>
              ))}
              {passedTests.length === 0 && runningTests.length === 0 && (
                <div className="text-sm text-slate-600 italic">Waiting for run...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'coverage' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={card}>
            <div className={sectionTitle}>Coverage Stats</div>
            <div className="space-y-1">
              <div className={row}>
                <span className="text-slate-400">Total files</span>
                <span className="text-slate-200 font-semibold">{totalFiles}</span>
              </div>
              <div className={row}>
                <span className="text-slate-400">Untested</span>
                <span className="text-red-400 font-semibold">{untestedFiles.length}</span>
              </div>
              <div className={row}>
                <span className="text-slate-400">Coverage rate</span>
                <span className="text-slate-200 font-semibold">
                  {totalFiles > 0 ? Math.round(((totalFiles - untestedFiles.length) / totalFiles) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className={card}>
            <div className={sectionTitle}>
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
              Missing Tests ({untestedFiles.length})
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {untestedFiles.length === 0 ? (
                <div className="text-sm text-emerald-400">All files have tests</div>
              ) : (
                untestedFiles.slice(0, 15).map((gap, i) => (
                  <div key={i} className="bg-red-950/30 border border-red-900/30 rounded px-3 py-1.5 text-xs text-red-300">{gap}</div>
                ))
              )}
              {untestedFiles.length > 15 && (
                <div className="text-[11px] text-slate-500 pt-1">... and {untestedFiles.length - 15} more</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schema' && (
        <div className={card}>
          <div className={sectionTitle}>
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            Schema Drift Detection
          </div>
          {driftResult ? (
            <div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-3 ${
                driftResult.verdict === 'CLEAN'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-red-950 text-red-400 border border-red-800'
              }`}>
                {driftResult.verdict === 'CLEAN' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {driftResult.verdict}
              </div>
              <div className="space-y-1">
                <div className={row}>
                  <span className="text-slate-400">Types table count</span>
                  <span className="text-slate-200 font-semibold">{driftResult.typesTableCount}</span>
                </div>
                <div className={row}>
                  <span className="text-slate-400">Missing from types</span>
                  <span className="text-red-400 font-semibold">{driftResult.missingFromTypes.length}</span>
                </div>
                <div className={row}>
                  <span className="text-slate-400">Extra in types</span>
                  <span className="text-orange-400 font-semibold">{driftResult.extraInTypes.length}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Click <strong className="text-slate-300">DRIFT</strong> to run schema drift detection.</div>
          )}
        </div>
      )}

      {activeTab === 'security' && (
        <div className={card}>
          <div className={sectionTitle}>
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            RLS Policy Audit
          </div>
          {rlsResult ? (
            <div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-3 ${
                rlsResult.verdict === 'PASS'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-red-950 text-red-400 border border-red-800'
              }`}>
                {rlsResult.verdict === 'PASS' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {rlsResult.verdict}
              </div>
              <div className="space-y-1">
                <div className={row}>
                  <span className="text-slate-400">Critical issues</span>
                  <span className={`font-semibold ${rlsResult.criticalCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {rlsResult.criticalCount}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Click <strong className="text-slate-300">RLS</strong> to run the policy audit.</div>
          )}
        </div>
      )}
    </div>
  )
}
