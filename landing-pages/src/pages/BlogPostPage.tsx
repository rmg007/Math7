import { useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ArrowLeft, Clock, Calendar, Share2, BookmarkPlus } from 'lucide-react';

// Placeholder blog post data - in production, this would come from a CMS or API
const blogPostData: Record<string, {
  title: string;
  category: string;
  readTime: string;
  date: string;
  author: string;
  content: string[];
}> = {
  'adaptive-learning-k12-education': {
    title: 'How Adaptive Learning is Reshaping K-12 Education',
    category: 'Pedagogy',
    readTime: '5 min read',
    date: 'January 28, 2024',
    author: 'Dr. Sarah Chen',
    content: [
      'Adaptive learning technology represents one of the most significant shifts in educational methodology since the introduction of the classroom model. By leveraging artificial intelligence and sophisticated algorithms, these systems can now provide truly personalized learning experiences at scale.',
      'Unlike traditional one-size-fits-all approaches, adaptive learning platforms continuously assess student understanding and adjust content difficulty, pacing, and even teaching style in real-time. This ensures that each student receives instruction tailored to their unique needs and abilities.',
      'Research from the Gates Foundation shows that students using adaptive learning platforms demonstrate 30% faster mastery of concepts compared to traditional instruction methods. More importantly, these gains are consistent across different demographic groups, suggesting that adaptive learning may help close achievement gaps.',
      'The key to effective adaptive learning lies in its ability to identify knowledge gaps before they become obstacles. When a student struggles with a concept, the system can automatically provide additional practice, alternative explanations, or prerequisite content to build a stronger foundation.',
      'As we look to the future, the integration of adaptive learning with other emerging technologies—such as virtual reality and natural language processing—promises even more immersive and effective educational experiences.'
    ]
  },
  'calculus-retention-techniques': {
    title: '10 Proven Techniques to Improve Calculus Retention',
    category: 'Study Tips',
    readTime: '7 min read',
    date: 'January 25, 2024',
    author: 'Prof. Michael Torres',
    content: [
      'Calculus is often considered a gateway subject—master it, and higher mathematics becomes accessible. Struggle with it, and many STEM careers become significantly more challenging. The good news is that calculus mastery is achievable with the right study techniques.',
      'Spaced repetition is perhaps the most powerful tool for long-term retention. Instead of cramming all your calculus study into one session, distribute your practice over time. Review concepts at increasing intervals: one day, three days, one week, two weeks.',
      'Active problem-solving beats passive reading every time. For every hour of reading calculus theory, spend at least two hours solving problems. Start with guided examples, then progress to independent problem-solving.',
      'Visualization transforms abstract calculus concepts into concrete understanding. Use graphing tools to see how functions behave. Watch derivatives change in real-time. These visual representations create stronger memory traces than equations alone.',
      'Teaching others is the ultimate test of understanding. Join or form a study group where you take turns explaining concepts. If you can teach integration by parts to a classmate, you truly understand it.'
    ]
  },
  'gamification-student-engagement': {
    title: 'Why Gamification is the Secret to Student Engagement',
    category: 'EdTech Trends',
    readTime: '4 min read',
    date: 'January 22, 2024',
    author: 'Alex Rivera',
    content: [
      'When education feels like a game, learning becomes irresistible. Gamification—the application of game-design elements in non-game contexts—has emerged as one of the most effective tools for boosting student engagement and motivation.',
      'The psychology behind gamification is rooted in our innate desire for achievement, competition, and recognition. Points, badges, and leaderboards tap into these fundamental human drives, transforming mundane tasks into exciting challenges.',
      'But effective gamification goes beyond surface-level rewards. The best educational games create meaningful choices, clear goals, immediate feedback, and a sense of progression. Students should feel that their actions matter and that mastery is within reach.',
      'Research from the University of Colorado found that gamified learning environments increased student engagement by up to 60% and improved test scores by an average of 14%. These gains were most pronounced among students who typically struggled with motivation.',
      'The future of gamified education lies in adaptive game mechanics that adjust to individual student needs. Imagine a learning game that becomes more challenging as you improve, always keeping you in that perfect zone of engagement and growth.'
    ]
  }
};

const categoryColors: Record<string, { bg: string; text: string }> = {
  'Pedagogy': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Study Tips': { bg: 'bg-green-100', text: 'text-green-700' },
  'EdTech Trends': { bg: 'bg-blue-100', text: 'text-blue-700' }
};

export const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? blogPostData[slug] : null;
  
  if (!post) {
    return (
      <div className="min-h-screen bg-white font-sans text-gray-900">
        <Header />
        <main className="pt-32 pb-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
          <p className="text-gray-500 mb-8">The article you're looking for doesn't exist.</p>
          <a href="/blog" className="text-blue-600 hover:underline">← Back to Blog</a>
        </main>
        <Footer />
      </div>
    );
  }

  const colors = categoryColors[post.category] || { bg: 'bg-gray-100', text: 'text-gray-700' };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Header />

      <main className="pt-32 pb-20">
        {/* Back Link */}
        <div className="max-w-3xl mx-auto px-6 mb-8">
          <a href="/blog" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
            <ArrowLeft size={18} />
            Back to Blog
          </a>
        </div>

        {/* Article Header */}
        <article className="max-w-3xl mx-auto px-6">
          <header className="mb-12">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${colors.bg} ${colors.text} mb-4`}>
              {post.category}
            </span>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-6" style={{ lineHeight: '1.4' }}>
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-gray-500 mb-6">
              <span className="flex items-center gap-2">
                <Calendar size={16} />
                {post.date}
              </span>
              <span className="flex items-center gap-2">
                <Clock size={16} />
                {post.readTime}
              </span>
              <span>By {post.author}</span>
            </div>
            
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors">
                <Share2 size={16} />
                Share
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors">
                <BookmarkPlus size={16} />
                Save
              </button>
            </div>
          </header>

          {/* Featured Image */}
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-12 flex items-center justify-center">
            <div className="text-8xl opacity-30">📚</div>
          </div>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            {post.content.map((paragraph, idx) => (
              <p key={idx} className="text-gray-600 leading-relaxed mb-6" style={{ lineHeight: '1.8' }}>
                {paragraph}
              </p>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Learning?</h3>
            <p className="text-gray-600 mb-6">Start your personalized learning journey with Questerix today.</p>
            <a 
              href="/"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started Free
            </a>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};
