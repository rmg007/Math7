import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSanitizedErrorResponse, withErrorSanitization } from "../_shared/error-sanitizer.ts";
import { addRateLimitHeaders, createRateLimitMiddleware, rateLimitConfigs } from "../_shared/rate-limiter.ts";

interface ErrorRecord {
  id: string;
  platform: string;
  error_type: string;
  error_message: string;
  extra_context: {
    severity?: string;
    alert_needed?: string;
    [key: string]: any;
  };
}

const rateLimit = createRateLimitMiddleware(rateLimitConfigs.anonymous);

/**
 * Constant-time comparison for strings to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

import { checkEnvironmentGuard } from "../_shared/env-guard.ts";

export const criticalAlertHandler = withErrorSanitization(
  async (req: Request) => {
    // Rate limiting
    const rateLimitResult = rateLimit.middleware(req);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // ========================================
    // NEW: ENVIRONMENT GUARD (SEC-P0-02)
    // ========================================
    const envError = await checkEnvironmentGuard(req);
    if (envError) return envError;

    const webhookSecret = Deno.env.get("ERROR_WEBHOOK_SECRET");
    const incomingSecret = req.headers.get("x-webhook-secret");

    if (!webhookSecret) {
      console.error("ERROR_WEBHOOK_SECRET is not set in environment.");
      return createSanitizedErrorResponse('INTERNAL_ERROR', 'Server configuration error');
    }

    if (!timingSafeEqual(incomingSecret || "", webhookSecret)) {
      console.warn("Unauthorized critical-alert attempt detected.");
      return createSanitizedErrorResponse('UNAUTHORIZED', 'Unauthorized');
    }

    const payload = await req.json();
    const { record, type } = payload as { record: ErrorRecord, type: string };

    // Check if it's a critical error
    const isCritical = 
      record.error_type?.toLowerCase().includes("critical") || 
      record.extra_context?.severity === "critical" ||
      record.extra_context?.alert_needed === "true";

    if (type === "INSERT" && isCritical) {
      console.log(`🚨 CRITICAL ERROR DETECTED: [${record.platform}] ${record.error_type}`);
      // In production, this would trigger an external notification
    }

    const httpResponse = new Response(JSON.stringify({ message: isCritical ? "Alert processed" : "No alert needed", id: record.id }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

    return addRateLimitHeaders(httpResponse, rateLimitResult.rateLimitResult);
  },
  { statusCode: 500, includeRequestId: true }
);

if (import.meta.main) {
  serve(criticalAlertHandler);
}
