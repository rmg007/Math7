import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { DetailTabs } from './components/DetailTabs'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Terminal } from './components/Terminal'
import { VerifyDeploy } from './components/VerifyDeploy'
import type {
    AnalystResults,
    DriftResult,
    HistoryRecord,
    LogItem,
    RlsAuditResult,
    SurfaceMap,
    TestResults,
    VerifyDeployCompletePayload,
    VerifyDeployHistory,
    VerifyDeployProgressPayload,
} from './types'

function App() {
  const socketRef = useRef<Socket | null>(null)
  const [testResults, setTestResults] = useState<Record<string, TestResults>>({})
  const [surfaceMap, setSurfaceMap] = useState<SurfaceMap | null>(null)
  const [analystResults, setAnalystResults] = useState<AnalystResults | null>(null)
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [smokePass, setSmokePass] = useState<boolean>(true)
  const [driftResult, setDriftResult] = useState<DriftResult | null>(null)
  const [rlsResult, setRlsResult] = useState<RlsAuditResult | null>(null)
  const [logs, setLogs] = useState<LogItem[]>([])
  const [isConnected, setIsConnected] = useState(false)

  // ── Verify Deploy state ────────────────────────────────────────────────────
  const [verifyProgress, setVerifyProgress] = useState<VerifyDeployProgressPayload | null>(null)
  const [verifyLastResult, setVerifyLastResult] = useState<VerifyDeployCompletePayload | null>(null)
  const [verifyHistory, setVerifyHistory] = useState<VerifyDeployHistory[]>([])
  const [verifyIsRunning, setVerifyIsRunning] = useState(false)

  useEffect(() => {
    const cortexUrl = import.meta.env.VITE_CORTEX_URL as string | undefined
    const newSocket = cortexUrl ? io(cortexUrl) : io()
    socketRef.current = newSocket

    newSocket.on('connect', () => setIsConnected(true))
    newSocket.on('disconnect', () => setIsConnected(false))

    newSocket.on('logs', (historicalLogs: LogItem[]) => {
      console.log('Received historical logs:', historicalLogs.length)
      setLogs(historicalLogs)
    })

    newSocket.on('log', (logItem: LogItem) => {
      console.log('Received log:', logItem.text)
      setLogs(prev => [...prev.slice(-99), logItem])
    })

    newSocket.on('update', (data: {
      results?: Record<string, TestResults>
      surfaceMap?: SurfaceMap | null
      analystResults?: AnalystResults | null
      history?: HistoryRecord[]
      smokePass?: boolean
      driftResult?: DriftResult | null
      rlsResult?: RlsAuditResult | null
      logs?: LogItem[]
    }) => {
      console.log('Received update payload')
      setTestResults(data.results ?? {})
      setSurfaceMap(data.surfaceMap ?? null)
      setAnalystResults(data.analystResults ?? null)
      setHistory(data.history ?? [])
      setSmokePass(data.smokePass ?? true)
      setDriftResult(data.driftResult ?? null)
      setRlsResult(data.rlsResult ?? null)
      if (data.logs) setLogs(data.logs)
    })

    // ── Verify Deploy socket events ──────────────────────────────────────────
    newSocket.on('verifyDeployProgress', (payload: VerifyDeployProgressPayload) => {
      setVerifyIsRunning(true)
      setVerifyProgress(prev => {
        // Accumulate checks from individual checkUpdate events
        if (payload.latestCheck) {
          const prevChecks = prev?.checks ?? []
          const alreadyPresent = prevChecks.some(
            c => c.category === payload.latestCheck!.category && c.name === payload.latestCheck!.name
          )
          if (!alreadyPresent) {
            return { ...payload, checks: [...prevChecks, payload.latestCheck] }
          }
        }
        return { ...payload, checks: prev?.checks ?? [] }
      })
    })

    newSocket.on('verifyDeployComplete', (payload: VerifyDeployCompletePayload) => {
      setVerifyIsRunning(false)
      setVerifyLastResult(payload)
      setVerifyHistory(payload.history)
      setVerifyProgress(null)
    })

    newSocket.on('verifyDeployHistory', (history: VerifyDeployHistory[]) => {
      setVerifyHistory(history)
    })

    return () => {
      newSocket.close()
      socketRef.current = null
    }
  }, [])

  const handleTrigger = (target: string) => {
    socketRef.current?.emit('trigger', target)
  }

  const handleVerifyDeploy = (targetUrl: string) => {
    setVerifyIsRunning(true)
    setVerifyProgress(null)
    setVerifyLastResult(null)
    socketRef.current?.emit('verifyDeploy', { targetUrl })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <Header isConnected={isConnected} onTrigger={handleTrigger} smokePass={smokePass} />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Hero
          testResults={testResults}
          surfaceMap={surfaceMap}
          analystResults={analystResults}
          history={history}
          smokePass={smokePass}
        />
        <VerifyDeploy
          onVerifyDeploy={handleVerifyDeploy}
          progress={verifyProgress}
          lastResult={verifyLastResult}
          history={verifyHistory}
          isRunning={verifyIsRunning}
        />
        <Terminal logs={logs} />
        <DetailTabs
          testResults={testResults}
          surfaceMap={surfaceMap}
          driftResult={driftResult}
          rlsResult={rlsResult}
        />
      </main>
    </div>
  )
}

export default App
