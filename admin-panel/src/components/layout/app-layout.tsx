import { Sidebar } from './sidebar'
import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Menu } from 'lucide-react'

export function AppLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const openMobileSidebar = () => setIsMobileSidebarOpen(true)
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="md:hidden">
        <Sidebar 
          isOpen={isMobileSidebarOpen} 
          onClose={closeMobileSidebar}
          isMobile={true}
        />
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={closeMobileSidebar}
            aria-hidden="true"
          />
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center h-16 px-4 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-white/10">
          <button
            onClick={openMobileSidebar}
            className="p-2 rounded-lg text-purple-200 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3 ml-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white">Questerix</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
