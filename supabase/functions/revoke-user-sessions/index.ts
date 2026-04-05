import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSanitizedErrorResponse, withErrorSanitization } from '../_shared/error-sanitizer.ts';
import { addRateLimitHeaders, createRateLimitMiddleware, rateLimitConfigs } from '../_shared/rate-limiter.ts';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://admin.questerix.com',
  'https://app.questerix.com',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
  }
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS[ALLOWED_ORIGINS.length - 1],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

const rateLimit = createRateLimitMiddleware(rateLimitConfigs.validateContent, 'revoke-user-sessions');

import { checkEnvironmentGuard } from '../_shared/env-guard.ts';

export const revokeUserSessionsHandler = withErrorSanitization(
  async (req: Request, deps?: { supabase?: Record<string, unknown>; adminSupabase?: Record<string, unknown>; genAI?: Record<string, unknown> }) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: getCorsHeaders(req) });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit.middleware(req);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // ========================================
    // NEW: ENVIRONMENT GUARD (SEC-P0-02)
    // ========================================
    const envError = await checkEnvironmentGuard(req);
    if (envError) return envError;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createSanitizedErrorResponse('UNAUTHORIZED', 'Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create a user-scoped client that respects RLS
    const supabaseClient = (deps?.supabase as any) || createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the requesting user's JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return createSanitizedErrorResponse('UNAUTHORIZED', 'Invalid or expired token');
    }

    // Get user's app_id and admin status (respecting RLS)
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('app_id, role')
      .single();

    if (profileError || !profile?.app_id) {
      return createSanitizedErrorResponse('FORBIDDEN', 'User profile not found or missing tenant');
    }

    // Only admins can revoke sessions
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      return createSanitizedErrorResponse('FORBIDDEN', 'Only administrators can revoke user sessions');
    }

    const { userId } = await req.json();

    if (!userId) {
      return createSanitizedErrorResponse('BAD_REQUEST', 'userId is required');
    }

    // Verify the target user belongs to the same tenant (respecting RLS)
    const { data: targetProfile, error: targetError } = await supabaseClient
      .from('profiles')
      .select('app_id')
      .eq('id', userId)
      .single();

    if (targetError || !targetProfile || targetProfile.app_id !== profile.app_id) {
      return createSanitizedErrorResponse('NOT_FOUND', 'Target user not found or access denied');
    }

    // Revoke all sessions using admin client
    const adminClient = (deps?.adminSupabase as any) || createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error: revokeError } = await adminClient.auth.admin.signOut(userId);

    if (revokeError) {
      console.error('Failed to revoke sessions:', revokeError);
      return createSanitizedErrorResponse('INTERNAL_ERROR', 'Failed to revoke user sessions');
    }

    const httpResponse = new Response(
      JSON.stringify({ success: true, message: 'User sessions revoked successfully' }),
      {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 200,
      }
    );

    return addRateLimitHeaders(httpResponse, rateLimitResult.rateLimitResult);
  },
  { statusCode: 500, includeRequestId: true }
);

// Start the server only if run as main
if (import.meta.main) {
  serve(revokeUserSessionsHandler);
}
