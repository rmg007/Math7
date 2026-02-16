import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // "Remember Me" eviction: if there IS a session but the user logged in
      // without "Remember Me" checked, localStorage won't have the flag.
      // When the tab/browser closes, sessionStorage is destroyed. On the
      // next visit, both flags are absent → the session should be evicted.
      if (session) {
        // Always mark the current tab as having an active session.
        // The "Remember Me" eviction only fires on a fresh browser
        // open (i.e. a *new* tab after the browser was fully closed).
        // Within the same browser session, navigation must never logout.
        sessionStorage.setItem('questerix_session_active', '1');

        const rememberMe = localStorage.getItem('questerix_remember_me');
        const sessionActive = sessionStorage.getItem('questerix_session_active');

        // Only evict if the browser was fully closed (sessionStorage
        // was cleared) AND the user did not check "Remember Me".
        if (!rememberMe && !sessionActive) {
          await supabase.auth.signOut();
          navigate('/login');
          return;
        }
      }

      if (!session) {
        navigate('/login');
        return;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('deleted_at')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Could not fetch profile, redirecting to login:', profileError);
          window.location.href = '/login';
          return;
        }

        if (profile && profile.deleted_at) {
          await supabase.auth.signOut();
          navigate('/login');
          return;
        }
      } catch (e) {
        console.warn('Profile check failed, allowing access:', e);
      }

      setLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login');
      } else if (event === 'SIGNED_IN') {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-1000">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20 flex items-center justify-center animate-pulse">
            <svg
              className="w-8 h-8 text-white"
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
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-sm font-black text-slate-900 tracking-tight italic">
              VERIFYING SESSION
            </h2>
            <div className="h-1 w-12 bg-indigo-500 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
