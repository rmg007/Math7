import { ArrowRight, Star, GraduationCap, Book, ChevronLeft } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { Header } from '../components/Header';

type SubjectData = Database['public']['Tables']['subjects']['Row'];

export const SubjectHubPage = ({ subject }: { subject: SubjectData | null }) => {
  // Color available for future theming: subject?.color_hex || '#3B82F6'
  
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      <Header />
      
      <main className="pt-24 pb-20">
        {/* Dynamic Hero Section */}
        <section className="max-w-7xl mx-auto px-6 mb-20 relative overflow-hidden">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-16 text-white text-center relative shadow-2xl shadow-blue-900/20">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 blur-3xl rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 opacity-20 blur-3xl rounded-full -ml-16 -mb-16"></div>

            <div className="relative z-10 flex flex-col items-center">
               <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/20">
                 <Star size={16} className="text-yellow-300 fill-yellow-300" />
                 <span>Primary Curriculum Hub</span>
               </div>
               
               <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
                 Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-white">{subject?.name || 'Mathematics'}</span>
               </h1>
               
               <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                 A comprehensive learning path designed to build confidence from Kindergarten through Grade 12.
               </p>

               <a href="/" className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-full font-bold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                 <ChevronLeft size={20} /> Back to all subjects
               </a>
            </div>
          </div>
        </section>

        {/* Grade Levels Grid */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                <GraduationCap className="text-blue-600" />
                Curriculum Roadmap
              </h3>
              <p className="text-gray-500">Select a grade to access specific learning modules.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(grade => {
               const Icon = grade < 6 ? Star : (grade < 9 ? Book : GraduationCap);
               const gradeText = grade === 0 ? 'Kindergarten' : `Grade ${grade}`;
               const subText = grade === 0 ? 'Early Learning' : (grade < 6 ? 'Elementary' : (grade < 9 ? 'Middle School' : 'High School'));
               const iconColor = grade < 6 ? 'text-yellow-500' : (grade < 9 ? 'text-teal-500' : 'text-indigo-500');
               const bgHover = grade < 6 ? 'group-hover:bg-yellow-50' : (grade < 9 ? 'group-hover:bg-teal-50' : 'group-hover:bg-indigo-50');

               return (
                <a 
                  key={grade} 
                  href="#" 
                  className={`group bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 relative overflow-hidden`}
                >
                  <div className={`absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-gray-50 ${bgHover} flex items-center justify-center transition-colors shadow-inner`}>
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{gradeText}</h4>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{subText}</span>
                    </div>
                  </div>
                </a>
               );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};
