import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { BookOpen, Brain, TrendingUp, Target, CheckCircle2 } from 'lucide-react';

export const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Header />
      
      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 mb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Brain size={16} />
            Our Methodology
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
            How <span className="text-gradient">Questerix</span> Works
          </h1>
          
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Our adaptive learning system combines proven educational science with intelligent technology 
            to help every student achieve mastery.
          </p>
        </section>

        {/* 3-Step Process */}
        <section className="max-w-6xl mx-auto px-6 mb-20">
          <h2 className="text-3xl font-bold mb-12 text-center">The Questerix Learning Journey</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                1
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 pt-12 rounded-2xl h-full">
                <BookOpen className="text-blue-600 mb-4" size={32} />
                <h3 className="text-xl font-bold mb-3">Assess Your Level</h3>
                <p className="text-gray-600 leading-relaxed">
                  We start by understanding where you are. Our diagnostic questions identify your 
                  strengths and knowledge gaps across the curriculum.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                2
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 pt-12 rounded-2xl h-full">
                <Target className="text-purple-600 mb-4" size={32} />
                <h3 className="text-xl font-bold mb-3">Practice with Purpose</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get personalized practice questions tailored to your level. Our adaptive algorithm 
                  adjusts difficulty in real-time based on your performance.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                3
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 pt-12 rounded-2xl h-full">
                <TrendingUp className="text-green-600 mb-4" size={32} />
                <h3 className="text-xl font-bold mb-3">Achieve Mastery</h3>
                <p className="text-gray-600 leading-relaxed">
                  Track your progress as you master each skill. Spaced repetition ensures long-term 
                  retention, not just short-term memorization.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="max-w-6xl mx-auto px-6 mb-20">
          <h2 className="text-3xl font-bold mb-12 text-center">What Makes Us Different</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Adaptive Difficulty',
                desc: 'Questions automatically adjust to your skill level—never too easy, never too hard.',
              },
              {
                title: 'Spaced Repetition',
                desc: 'We bring back concepts at optimal intervals to strengthen long-term memory.',
              },
              {
                title: 'Instant Feedback',
                desc: 'Learn from mistakes immediately with detailed explanations for every question.',
              },
              {
                title: 'Progress Tracking',
                desc: 'Visualize your growth with detailed analytics and mastery indicators.',
              },
              {
                title: 'Offline Support',
                desc: 'Practice anywhere, anytime—even without an internet connection.',
              },
              {
                title: 'Gamified Learning',
                desc: 'Earn points, unlock achievements, and stay motivated on your learning journey.',
              },
            ].map((feature, i) => (
              <div key={i} className="flex gap-4 p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
                <CheckCircle2 className="text-green-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-12 rounded-3xl">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-blue-100 mb-8 text-lg">
              Join thousands of students who are achieving their academic goals with Questerix.
            </p>
            <a 
              href="http://localhost:3000"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-1"
            >
              Get Started Free
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
