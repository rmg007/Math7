import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function revokeUserSessionsHandler(req: Request, deps?: { supabase?: any }): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = deps?.supabase || createClient(supabaseUrl, supabaseServiceKey);

    // Verify the requesting user's JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get user's app_id and admin status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('app_id, is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.app_id) {
      return new Response(
        JSON.stringify({ error: 'User profile not found or missing tenant' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Only admins can revoke sessions
    if (!profile.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Only administrators can revoke user sessions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Verify the target user belongs to the same tenant
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('app_id')
      .eq('id', userId)
      .single();

    if (targetError || !targetProfile || targetProfile.app_id !== profile.app_id) {
      return new Response(
        JSON.stringify({ error: 'Target user not found or access denied' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Revoke all sessions for the target user
    const { error: revokeError } = await supabase.auth.admin.signOut(userId);

    if (revokeError) {
      console.error('Failed to revoke sessions:', revokeError);
      return new Response(
        JSON.stringify({ error: 'Failed to revoke user sessions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User sessions revoked successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Session revocation error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to revoke user sessions',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}

// Start the server only if run as main
if (import.meta.main) {
  serve(revokeUserSessionsHandler);
}
