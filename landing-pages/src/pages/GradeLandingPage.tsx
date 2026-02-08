import type { Database } from '../lib/database.types';

type AppData = Database['public']['Tables']['apps']['Row'] & {
  subjects: Database['public']['Tables']['subjects']['Row'] | null
};

export const GradeLandingPage = ({ app }: { app: AppData | null }) => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
       <header className="p-6 border-b sticky top-0 bg-white/90 backdrop-blur-md z-10">
         <div className="max-w-6xl mx-auto flex justify-between items-center">
             <h1 className="font-bold text-xl text-blue-600">Questerix <span className="text-gray-400">|</span> {app?.display_name}</h1>
             <a href="/app/login" className="text-gray-600 font-semibold hover:text-blue-600">Log In</a>
         </div>
       </header>
       <main className="max-w-4xl mx-auto py-16 px-4">
         <div className="text-center">
           <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide mb-4 inline-block">
             {app?.grade_level} Curriculum
           </span>
           <h2 className="text-6xl font-extrabold mb-6 text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 pb-2">
             {app?.display_name || 'Master This Grade'}
           </h2>
           <p className="text-2xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
             Comprehensive curriculum and personalized practice to help you master every concept.
           </p>
           <a 
             href={`/app`} 
             className="bg-blue-600 text-white px-10 py-5 rounded-full text-xl font-bold hover:bg-blue-700 transition shadow-xl hover:shadow-blue-600/30 transform hover:-translate-y-1 inline-block"
           >
             Start Learning Now
           </a>
           <p className="mt-4 text-sm text-gray-400">No credit card required for trial</p>
         </div>

         {/* Features Preview */}
         <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
               <div className="bg-blue-50 w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl">🎯</div>
               <h3 className="font-bold text-lg mb-2">Personalized</h3>
               <p className="text-gray-500">Adapts to your skill level automatically.</p>
            </div>
            <div>
               <div className="bg-purple-50 w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl">📊</div>
               <h3 className="font-bold text-lg mb-2">Analytics</h3>
               <p className="text-gray-500">Track progress with detailed reports.</p>
            </div>
            <div>
               <div className="bg-green-50 w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl">🏆</div>
               <h3 className="font-bold text-lg mb-2">Gamified</h3>
               <p className="text-gray-500">Earn badges and rewards as you learn.</p>
            </div>
         </div>
       </main>
    </div>
  );
};
