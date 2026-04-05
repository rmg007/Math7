export const LoadingPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
    <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-1000">
      <div className="relative">
        <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 shadow-2xl shadow-indigo-500/30 flex items-center justify-center animate-pulse">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-2xl animate-pulse delay-75" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-xl font-black text-slate-900 tracking-tight italic">INITIALIZING</h2>
        <p className="text-2xs font-black text-slate-700 uppercase tracking-[0.3em] ml-1">
          Secure Environment
        </p>
      </div>
    </div>
  </div>
);
