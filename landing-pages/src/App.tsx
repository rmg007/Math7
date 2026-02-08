import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { RootPage } from './pages/RootPage';
import { SubjectHubPage } from './pages/SubjectHubPage';
import { GradeLandingPage } from './pages/GradeLandingPage';
import { AboutPage } from './pages/AboutPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { DownloadIOSPage } from './pages/DownloadIOSPage';
import { DownloadAndroidPage } from './pages/DownloadAndroidPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { CookiesPage } from './pages/CookiesPage';
import { BlogPage } from './pages/BlogPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { supabase } from './lib/supabase';
import type { Database } from './lib/database.types';

type AppData = Database['public']['Tables']['apps']['Row'] & {
  subjects: Database['public']['Tables']['subjects']['Row'] | null
};

type SubjectData = Database['public']['Tables']['subjects']['Row'];

const getInitialSubdomain = () => {
  const hostname = window.location.hostname;
  // Localhost handling
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const params = new URLSearchParams(window.location.search);
    return params.get('subdomain');
  }
  // Production handling
  const parts = hostname.split('.');
  if (parts.length > 2) { 
     const subdomain = parts[0];
     if (subdomain !== 'www') return subdomain;
  }
  return null;
};

function HomePage() {
  const [view, setView] = useState<'root' | 'subject' | 'grade'>('root');
  const [data, setData] = useState<AppData | SubjectData | null>(null);
  const [loading, setLoading] = useState(() => Boolean(getInitialSubdomain()));

  useEffect(() => {
    const subdomain = getInitialSubdomain();
    if (!subdomain) return;

    const fetchSubdomain = async () => {
      console.log('Handling subdomain:', subdomain);
      
      // 1. Try to find an App (e.g. m7)
      const { data: appData, error: appError } = await supabase
        .from('apps')
        .select('*, subjects(*)')
        .eq('subdomain', subdomain)
        .maybeSingle();

      if (appError) console.error(appError);
       
      if (appData) {
        console.log('Found App:', appData);
        setView('grade');
        setData(appData);
        setLoading(false);
        return;
      }

      // 2. Try to find a Subject (e.g. math)
      const { data: subjectData, error: subjectError } = await supabase
         .from('subjects')
         .select('*')
         .eq('slug', subdomain)
         .maybeSingle();

      if (subjectError) console.error(subjectError);

       if (subjectData) {
         console.log('Found Subject:', subjectData);
         setView('subject');
         setData(subjectData);
         setLoading(false);
         return;
       }

       console.log('No match found for subdomain. Defaulting to root.');
       setLoading(false);
    };

    fetchSubdomain();
  }, []);

  if (loading) return (
     <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
     </div>
  );

  if (view === 'grade') return <GradeLandingPage app={data as AppData} />;
  if (view === 'subject') return <SubjectHubPage subject={data as SubjectData} />;
  return <RootPage />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/download/ios" element={<DownloadIOSPage />} />
        <Route path="/download/android" element={<DownloadAndroidPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
