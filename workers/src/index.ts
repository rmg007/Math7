import { handleGenerateQuestions } from './ai/generate-questions';
import { handleValidateContent } from './ai/validate-content';
import { handleSendAlert } from './email/send-alert';
import { corsPreflightResponse, errorResponse, jsonResponse } from './shared/http';
import type { Env } from './shared/types';

/**
 * Questerix Cloudflare Workers entry point.
 * Routes requests to AI and Email handlers.
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return corsPreflightResponse(request);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // AI Routes
      if (path === '/ai/generate-questions' && request.method === 'POST') {
        return await handleGenerateQuestions(request, env);
      }

      if (path === '/ai/validate-content' && request.method === 'POST') {
        return await handleValidateContent(request, env);
      }

      // Email Routes
      if (path === '/email/send-alert' && request.method === 'POST') {
        return await handleSendAlert(request, env);
      }

      // Health check
      if (path === '/health') {
        return jsonResponse(
          {
            status: 'ok',
            environment: env.ENVIRONMENT,
            timestamp: new Date().toISOString(),
            routes: [
              'POST /ai/generate-questions',
              'POST /ai/validate-content',
              'POST /email/send-alert',
              'GET /health',
            ],
          },
          200,
          request,
        );
      }

      return errorResponse('Not found', 404, request);
    } catch (err) {
      console.error('Unhandled worker error:', err);
      return errorResponse('Internal server error', 500, request);
    }
  },
} satisfies ExportedHandler<Env>;
