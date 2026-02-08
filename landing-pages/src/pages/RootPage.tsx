import { ArrowRight, BookOpen, Sigma, FlaskConical, GraduationCap, type LucideIcon } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { BlogSection } from '../components/BlogSection';

interface SubjectData {
  title: string;
  shortDesc: string;
  fullDesc: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  link: string;
  standards: string[];
  outcomes: string[];
}

const subjects: SubjectData[] = [
  {
    title: 'Mathematics',
    shortDesc: 'Master the language of the universe.',
    fullDesc: 'Our mathematics curriculum builds strong foundational skills through a mastery-based approach aligned with Common Core State Standards and International Baccalaureate (IB) frameworks. Students progress through carefully scaffolded concepts—from number sense and basic operations to algebra, geometry, and advanced calculus. Our adaptive learning engine identifies knowledge gaps in real-time, providing targeted practice that ensures lasting retention. With over 10,000 interactive problems and step-by-step solutions, learners develop both procedural fluency and deep conceptual understanding.',
    icon: Sigma,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    link: typeof window !== 'undefined' && window.location.hostname.includes('localhost') ? '/?subdomain=math' : 'https://Farida.Questerix.com',
    standards: ['Common Core', 'IB', 'State Standards'],
    outcomes: ['Problem-solving mastery', 'Critical thinking', 'Mathematical reasoning']
  },
  {
    title: 'English Language Arts',
    shortDesc: 'Unlock the power of communication.',
    fullDesc: 'Questerix English Language Arts empowers students with essential literacy skills through an integrated approach to reading, writing, speaking, and language mechanics. Our curriculum aligns with Common Core ELA standards and emphasizes evidence-based reading comprehension, analytical writing, and vocabulary acquisition. Students engage with diverse literary texts spanning fiction, non-fiction, poetry, and drama while developing their own voice as writers. Personalized feedback on written assignments accelerates skill development.',
    icon: BookOpen,
    colorClass: 'text-teal-600',
    bgClass: 'bg-teal-50',
    link: '#',
    standards: ['Common Core ELA', 'NCTE Standards'],
    outcomes: ['Reading comprehension', 'Written expression', 'Critical analysis']
  },
  {
    title: 'Science',
    shortDesc: 'Discover how the world works.',
    fullDesc: 'Our science curriculum cultivates scientific literacy and inquiry-based thinking across life sciences, physical sciences, earth sciences, and engineering. Aligned with Next Generation Science Standards (NGSS), students explore phenomena through virtual laboratories, interactive simulations, and real-world problem sets. The three-dimensional learning approach integrates disciplinary core ideas, science practices, and crosscutting concepts to develop well-rounded scientific thinkers prepared for STEM careers.',
    icon: FlaskConical,
    colorClass: 'text-orange-600',
    bgClass: 'bg-orange-50',
    link: '#',
    standards: ['NGSS', 'State Science Standards'],
    outcomes: ['Scientific inquiry', 'Data analysis', 'Experimental design']
  }
];

const SubjectCard = ({ subject }: { subject: SubjectData }) => {
  const Icon = subject.icon;
  
  return (
    <article 
      onClick={() => window.location.href = subject.link}
      className="group bg-white border border-gray-100 p-8 rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1 relative overflow-hidden"
      role="link"
      aria-label={`Explore ${subject.title} curriculum`}
    >
      <div 
        className={`absolute top-0 right-0 w-32 h-32 ${subject.bgClass} opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700`}
        aria-hidden="true"
      />
      
      <div 
        className={`w-14 h-14 ${subject.bgClass} rounded-xl mb-6 flex items-center justify-center ${subject.colorClass} shadow-inner`}
        aria-hidden="true"
      >
        <Icon size={28} strokeWidth={2.5} aria-label={`${subject.title} subject icon`} />
      </div>
      
      <h3 className="text-2xl font-bold mb-3 text-gray-900">{subject.title}</h3>
      <p className="text-gray-600 leading-relaxed mb-4">{subject.fullDesc}</p>
      
      {/* Standards Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {subject.standards.map((standard) => (
          <span 
            key={standard}
            className={`text-xs px-2 py-1 rounded-full ${subject.bgClass} ${subject.colorClass} font-medium`}
          >
            {standard}
          </span>
        ))}
      </div>
      
      {/* Learning Outcomes */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-2">Learning Outcomes:</p>
        <ul className="text-sm text-gray-500 space-y-1">
          {subject.outcomes.map((outcome) => (
            <li key={outcome} className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${subject.colorClass.replace('text-', 'bg-')}`} aria-hidden="true" />
              {outcome}
            </li>
          ))}
        </ul>
      </div>
      
      <div className={`flex items-center font-semibold ${subject.colorClass} group-hover:translate-x-2 transition-transform`}>
        <span>Explore Curriculum</span>
        <ArrowRight size={18} className="ml-2" aria-hidden="true" />
      </div>
    </article>
  );
};

export const RootPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      <Header />

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 mb-32 text-center relative" aria-labelledby="hero-heading">
          {/* Ambient Background Glows */}
          <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[800px] h-[800px] bg-blue-100/50 -z-10 blur-3xl rounded-full opacity-60 mix-blend-multiply animate-pulse-slow" aria-hidden="true" />
          <div className="absolute top-20 right-1/4 translate-x-1/2 w-[600px] h-[600px] bg-purple-100/50 -z-10 blur-3xl rounded-full opacity-60 mix-blend-multiply animate-pulse-slow delay-700" aria-hidden="true" />
          
          <h1 id="hero-heading" className="text-6xl md:text-7xl font-extrabold mb-8 tracking-tight leading-[1.1]">
            Transform Your <br />
            <span className="text-gradient">Academic Journey</span>
          </h1>
          
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            From Preschool to University - Master every subject with personalized learning paths, real-time analytics, and gamified progress tracking.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href="/download/ios"
              className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Start Learning Free 
              <ArrowRight size={20} aria-hidden="true" />
            </a>
            <a 
              href="/how-it-works"
              className="bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <GraduationCap size={20} aria-hidden="true" />
              View Methodology
            </a>
          </div>
        </section>

        {/* Subjects Grid */}
        <section id="subjects" className="max-w-7xl mx-auto px-6 mb-20" aria-labelledby="subjects-heading">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <h2 id="subjects-heading" className="text-3xl font-bold mb-4 text-gray-900">Explore Our Curriculum</h2>
              <p className="text-gray-500 text-lg max-w-xl">
                Standards-aligned courses designed by educators, powered by adaptive learning technology to meet every student where they are.
              </p>
            </div>
            <a href="/about" className="flex items-center font-medium text-blue-600 hover:text-blue-700 group">
              View all subjects 
              <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </a>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {subjects.map((subject) => (
              <SubjectCard key={subject.title} subject={subject} />
            ))}
          </div>
        </section>

        {/* Blog Section */}
        <BlogSection />
      </main>
      
      <Footer />
    </div>
  );
};
