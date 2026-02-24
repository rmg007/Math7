import { useEffect, useRef } from 'react'
import type { LogItem } from '../types'

interface TerminalProps {
  logs: LogItem[]
}

export function Terminal({ logs }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])

  const getColorClass = (color?: string) => {
    switch (color) {
      case 'cyan': return 'text-cyan-400'
      case 'green': return 'text-emerald-400'
      case 'red': return 'text-red-400'
      case 'gray': return 'text-slate-500'
      default: return 'text-slate-300'
    }
  }

  return (
    <div className="bg-black border border-slate-800 rounded-xl p-4 shadow-inner overflow-hidden">
      <div 
        ref={terminalRef}
        className="h-[300px] overflow-y-auto space-y-1 font-mono text-[13px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent pr-2"
      >
        {logs.length === 0 ? (
          <div className="text-slate-600 animate-pulse">Initializing Questerix Cortex stream...</div>
        ) : (
          logs.map((log, i) => (
            <div 
              key={i} 
              className={`${getColorClass(log.color)} ${log.bold ? 'font-bold' : 'font-normal'} leading-relaxed whitespace-pre-wrap`}
            >
              {log.text}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
