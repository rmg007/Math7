import { CheckSquare, ChevronDown, Play, Square, Wifi, WifiOff, Zap } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  isConnected: boolean
  onTrigger: (target: string) => void
  smokePass: boolean
}

const btnBase = 'px-3 py-1.5 text-xs font-semibold rounded-md transition-all hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed'

interface Option {
  id: string
  label: string
  category: string
}

const OPTIONS: Option[] = [
  { id: 'unit', label: 'Unit Tests', category: 'Smoke' },
  { id: 'e2e', label: 'E2E Smoke', category: 'Smoke' },
  { id: 'lint', label: 'Lint Check', category: 'Smoke' },
  { id: 'tsc', label: 'TypeScript Strict', category: 'Deep' },
  { id: 'audit', label: 'Dependency Audit', category: 'Deep' },
  { id: 'full-vitest', label: 'Full Vitest + Coverage', category: 'Deep' },
  { id: 'full-playwright', label: 'Full Playwright Suite', category: 'Deep' },
  { id: 'drift', label: 'Schema Drift', category: 'Intel' },
  { id: 'rls', label: 'RLS Audit', category: 'Intel' },
  { id: 'forensic', label: 'Forensic Audit', category: 'Intel' },
  { id: 'build', label: 'Build Production', category: 'Lifecycle' },
  { id: 'certify', label: 'Certify Phase 0', category: 'Lifecycle' },
  { id: 'hygiene', label: 'Code Hygiene', category: 'Lifecycle' },
  { id: 'deploy', label: 'Deploy to Prod', category: 'Lifecycle' },
  { id: 'ship', label: 'Ship to Git', category: 'Lifecycle' },
]

export function Header({ isConnected, onTrigger, smokePass }: HeaderProps) {
  const [openMenu, setOpenMenu] = useState<boolean>(false)
  const [selected, setSelected] = useState<string[]>([])

  const toggleOption = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleRunBatch = () => {
    if (selected.length === 0) return
    onTrigger(selected.join(','))
    setOpenMenu(false)
    setSelected([])
  }

  const categorized = OPTIONS.reduce((acc, opt) => {
    if (!acc[opt.category]) acc[opt.category] = []
    acc[opt.category].push(opt)
    return acc
  }, {} as Record<string, Option[]>)

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-cyan-400 tracking-tight">Questerix Cortex</h1>
          {isConnected ? (
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-emerald-500">
              <Wifi className="w-3 h-3" /> Live
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-red-500">
              <WifiOff className="w-3 h-3" /> Offline
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Batch Selector Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setOpenMenu(!openMenu)}
              className={`${btnBase} bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-2 min-w-[140px] justify-between`}
            >
              <span>{selected.length > 0 ? `${selected.length} Selected` : 'Select Actions'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${openMenu ? 'rotate-180' : ''}`} />
            </button>

            {openMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 max-h-[80vh] overflow-y-auto">
                {Object.entries(categorized).map(([cat, opts]) => (
                  <div key={cat} className="mb-2">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800/50 mb-1">
                      {cat}
                    </div>
                    {opts.map(opt => {
                      const isLifecycle = cat === 'Lifecycle'
                      const disabled = isLifecycle && !smokePass
                      return (
                        <button 
                          key={opt.id}
                          disabled={disabled}
                          onClick={() => toggleOption(opt.id)}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-800 text-slate-300'}`}
                        >
                          {selected.includes(opt.id) ? (
                            <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-600" />
                          )}
                          <span className={isLifecycle ? 'text-amber-400/90' : ''}>{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                ))}
                
                <div className="p-2 border-t border-slate-800 mt-1 sticky bottom-0 bg-slate-900">
                  <button 
                    disabled={selected.length === 0}
                    onClick={handleRunBatch}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:bg-slate-800 disabled:text-slate-600"
                  >
                    <Play className="w-3 h-3 fill-current" /> Run {selected.length} Actions
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-slate-800 mx-1" />

          {/* Preset Buttons */}
          <button 
            onClick={() => onTrigger('all')} 
            className={`${btnBase} bg-slate-800 border border-slate-700 text-slate-300`}
          >
            SMOKE
          </button>

          <button 
            onClick={() => onTrigger('full')} 
            className={`${btnBase} bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white flex items-center gap-1.5 px-4 shadow-lg shadow-violet-900/20`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" /> <span className="uppercase tracking-wider font-bold">Full Run</span>
          </button>
        </div>
      </div>
      
      {/* Click outside to close menu */}
      {openMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(false)} />
      )}
    </header>
  )
}
