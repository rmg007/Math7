import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ArrowRight, Clock, Search } from 'lucide-react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
}

const allPosts: BlogPost[] = [
  {
    id: '1',
    slug: 'adaptive-learning-k12-education',
    title: 'How Adaptive Learning is Reshaping K-12 Education',
    excerpt: 'Discover how AI-powered adaptive learning systems are revolutionizing how students learn. From personalized pacing to intelligent feedback, explore the future of education.',
    category: 'Pedagogy',
    readTime: '5 min read',
    date: 'Jan 28, 2024'
  },
  {
    id: '2',
    slug: 'calculus-retention-techniques',
    title: '10 Proven Techniques to Improve Calculus Retention',
    excerpt: 'Master calculus with these science-backed strategies for long-term memory retention. Learn how spaced repetition and active recall can transform your math skills.',
    category: 'Study Tips',
    readTime: '7 min read',
    date: 'Jan 25, 2024'
  },
  {
    id: '3',
    slug: 'gamification-student-engagement',
    title: 'Why Gamification is the Secret to Student Engagement',
    excerpt: 'Learn how game mechanics transform mundane lessons into captivating experiences. Discover the psychology behind points, badges, and leaderboards in education.',
    category: 'EdTech Trends',
    readTime: '4 min read',
    date: 'Jan 22, 2024'
  },
  {
    id: '4',
    slug: 'mastery-based-learning-explained',
    title: 'Mastery-Based Learning: A Complete Guide for Parents',
    excerpt: 'Understand how mastery-based learning differs from traditional grading and why it leads to deeper understanding and better outcomes for students.',
    category: 'Pedagogy',
    readTime: '6 min read',
    date: 'Jan 18, 2024'
  },
  {
    id: '5',
    slug: 'note-taking-strategies',
    title: 'The Ultimate Guide to Effective Note-Taking',
    excerpt: 'From Cornell Notes to Mind Mapping, discover which note-taking method works best for your learning style and subject matter.',
    category: 'Study Tips',
    readTime: '8 min read',
    date: 'Jan 15, 2024'
  },
  {
    id: '6',
    slug: 'ai-tutoring-future',
    title: 'AI Tutoring: What to Expect in 2024 and Beyond',
    excerpt: 'Explore the cutting-edge developments in AI-powered tutoring and how they\'re making personalized education accessible to everyone.',
    category: 'EdTech Trends',
    readTime: '5 min read',
    date: 'Jan 12, 2024'
  }
];

const categories = ['All', 'Pedagogy', 'Study Tips', 'EdTech Trends'];

const categoryColors: Record<string, { bg: string; text: string }> = {
  'Pedagogy': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Study Tips': { bg: 'bg-green-100', text: 'text-green-700' },
  'EdTech Trends': { bg: 'bg-blue-100', text: 'text-blue-700' }
};

export const BlogPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Header />

      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 mb-16 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-6">
            📚 Blog & Resources
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ lineHeight: '1.4' }}>
            Insights for Modern <span className="text-blue-600">Learning</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
            Expert articles on education, study strategies, and the latest in educational technology.
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Search articles..."
              className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>
        </section>

        {/* Categories */}
        <section className="max-w-7xl mx-auto px-6 mb-12">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat, idx) => (
              <button
                key={cat}
                className={`px-5 py-2 rounded-full font-medium transition-all ${
                  idx === 0 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Articles Grid */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allPosts.map((post) => {
              const colors = categoryColors[post.category] || { bg: 'bg-gray-100', text: 'text-gray-700' };
              
              return (
                <article 
                  key={post.id}
                  className="group bg-white rounded-xl overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  style={{ borderRadius: '12px' }}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                      <div className="text-6xl opacity-30">📚</div>
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                        {post.category}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-gray-400 text-sm mb-3">
                      <span>{post.date}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {post.readTime}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors" style={{ lineHeight: '1.4' }}>
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <a 
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold transition-all group-hover:gap-3"
                      style={{ color: '#0055ff' }}
                    >
                      Read More
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
          
          {/* Load More */}
          <div className="text-center mt-12">
            <button className="px-8 py-3 rounded-full border-2 border-gray-200 font-semibold text-gray-600 hover:border-blue-600 hover:text-blue-600 transition-all">
              Load More Articles
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
