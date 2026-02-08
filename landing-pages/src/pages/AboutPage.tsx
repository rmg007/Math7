import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Target, Users, Lightbulb, Award } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Header />
      
      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-6 mb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Target size={16} />
            About Questerix
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Transforming Education,<br />
            <span className="text-gradient">One Student at a Time</span>
          </h1>
          
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            We believe every student deserves personalized, engaging, and effective learning experiences. 
            Questerix makes mastery-based education accessible to everyone.
          </p>
        </section>

        {/* Mission Section */}
        <section className="max-w-6xl mx-auto px-6 mb-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-4">
                <Lightbulb size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To democratize high-quality education by providing adaptive, personalized learning tools 
                that meet students where they are and guide them to mastery.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white mb-4">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Our Approach</h3>
              <p className="text-gray-600 leading-relaxed">
                We combine proven pedagogical methods with modern technology: spaced repetition, 
                adaptive difficulty, and real-time feedback to maximize learning outcomes.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center text-white mb-4">
                <Award size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Our Impact</h3>
              <p className="text-gray-600 leading-relaxed">
                Thousands of students have improved their grades, built confidence, and discovered 
                a love for learning through our platform.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="max-w-4xl mx-auto px-6 mb-20">
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed space-y-4">
            <p>
              Questerix was born from a simple observation: traditional one-size-fits-all education 
              leaves too many students behind. Some need more time to master concepts, while others 
              are ready to race ahead. The classroom model struggles to accommodate both.
            </p>
            <p>
              We set out to build a platform that adapts to each student's unique learning pace and style. 
              Starting with mathematics—a subject where mastery builds upon mastery—we created an intelligent 
              system that identifies knowledge gaps, provides targeted practice, and celebrates progress.
            </p>
            <p>
              Today, Questerix serves students from kindergarten through university, across multiple subjects. 
              Our vision is to become the world's most effective personalized learning companion, helping 
              millions of students achieve their full potential.
            </p>
          </div>
        </section>

        {/* Values Section */}
        <section className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Student-First', desc: 'Every decision we make prioritizes student learning outcomes and well-being.' },
              { title: 'Evidence-Based', desc: 'We ground our methods in cognitive science and educational research.' },
              { title: 'Accessible', desc: 'Quality education should be available to everyone, regardless of background.' },
              { title: 'Transparent', desc: 'We believe in clear communication with students, parents, and educators.' },
            ].map((value, i) => (
              <div key={i} className="border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
