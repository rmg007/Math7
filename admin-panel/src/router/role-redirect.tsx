import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { LoadingPage } from '@/components/layout/loading-page';

export const RoleRedirect = () => {
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState('/login');

  useEffect(() => {
    const abortController = new AbortController();

    const checkRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (abortController.signal.aborted) return;

      if (!user) {
        setTarget('/login');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (abortController.signal.aborted) return;

      if (profile?.role === 'super_admin') {
        setTarget('/dashboard');
      } else {
        setTarget('/domains');
      }
      setLoading(false);
    };

    checkRole();

    return () => {
      abortController.abort();
    };
  }, []);

  if (loading) return <LoadingPage />;
  return <Navigate to={target} replace />;
};
