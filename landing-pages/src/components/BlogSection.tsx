import { ArrowRight, Clock } from 'lucide-react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  thumbnail: string;
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    slug: 'adaptive-learning-k12-education',
    title: 'How Adaptive Learning is Reshaping K-12 Education',
    excerpt: 'Discover how AI-powered adaptive learning systems are revolutionizing how students learn.',
    category: 'Pedagogy',
    readTime: '5 min read',
    thumbnail: '/blog/adaptive-learning.jpg'
  },
  {
    id: '2',
    slug: 'calculus-retention-techniques',
    title: '10 Proven Techniques to Improve Calculus Retention',
    excerpt: 'Master calculus with these science-backed strategies for long-term memory retention.',
    category: 'Study Tips',
    readTime: '7 min read',
    thumbnail: '/blog/calculus-tips.jpg'
  },
  {
    id: '3',
    slug: 'gamification-student-engagement',
    title: 'Why Gamification is the Secret to Student Engagement',
    excerpt: 'Learn how game mechanics transform mundane lessons into captivating experiences.',
    category: 'EdTech Trends',
    readTime: '4 min read',
    thumbnail: '/blog/gamification.jpg'
  }
];

const categoryColors: Record<string, { bg: string; text: string }> = {
  'Pedagogy': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Study Tips': { bg: 'bg-green-100', text: 'text-green-700' },
  'EdTech Trends': { bg: 'bg-blue-100', text: 'text-blue-700' }
};

const BlogCard = ({ post }: { post: BlogPost }) => {
  const colors = categoryColors[post.category] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  
  return (
    <article 
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
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
          <Clock size={14} />
          <span>{post.readTime}</span>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors" style={{ lineHeight: '1.4' }}>
          {post.title}
        </h3>
        
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
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
};

export const BlogSection = () => {
  return (
    <section className="py-20 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-4">
              📖 Resources
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" style={{ lineHeight: '1.4' }}>
              Learn & Grow
            </h2>
            <p className="text-gray-500 text-lg max-w-lg">
              Expert insights on education, study techniques, and the future of learning.
            </p>
          </div>
          <a 
            href="/blog" 
            className="flex items-center gap-2 font-semibold hover:gap-3 transition-all"
            style={{ color: '#0055ff' }}
          >
            View all articles
            <ArrowRight size={18} />
          </a>
        </div>
        
        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
};
