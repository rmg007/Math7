import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSanitizedErrorResponse, withErrorSanitization } from "../_shared/error-sanitizer.ts";
import { addRateLimitHeaders, createRateLimitMiddleware, rateLimitConfigs } from "../_shared/rate-limiter.ts";
import { checkEnvironmentGuard } from "../_shared/env-guard.ts"

// --- HADES SECURITY PATCH: Externalize Infra IDs ---
const CLOUDFLARE_ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
const CLOUDFLARE_PROJECT_NAME = Deno.env.get("CLOUDFLARE_PROJECT_NAME") || "questerix-student";
const BASE_DOMAIN = Deno.env.get("BASE_DOMAIN") || "questerix.com";

const rateLimit = createRateLimitMiddleware(rateLimitConfigs.anonymous);

interface AppRecord {
  subdomain: string;
  [key: string]: any;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  record: AppRecord;
  old_record?: AppRecord;
}

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

export const manageAppDomainsHandler = withErrorSanitization(
  async (req: Request) => {
    // Rate limiting
    const rateLimitResult = rateLimit.middleware(req);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // --- HADES SECURITY PATCH: ENVIRONMENT GUARD ---
    const envError = checkEnvironmentGuard(req)
    if (envError) return envError

    const webhookSecret = Deno.env.get("DOMAIN_WEBHOOK_SECRET");
    const incomingSecret = req.headers.get("x-webhook-secret");

    // --- HADES SECURITY PATCH: MANDATORY SECRET ---
    if (!webhookSecret) {
      console.error("DOMAIN_WEBHOOK_SECRET missing in environment!");
      return createSanitizedErrorResponse('INTERNAL_ERROR', 'Server configuration error');
    }

    if (!CLOUDFLARE_ACCOUNT_ID) {
      console.error("CLOUDFLARE_ACCOUNT_ID missing in environment!");
      return createSanitizedErrorResponse('INTERNAL_ERROR', 'Server configuration error');
    }

    if (!timingSafeEqual(incomingSecret || "", webhookSecret)) {
      console.warn(`Unauthorized domain change attempt. Secret mismatch.`);
      return createSanitizedErrorResponse('UNAUTHORIZED', 'Unauthorized');
    }

    const apiToken = Deno.env.get("CLOUDFLARE_API_TOKEN");
    if (!apiToken) {
      return createSanitizedErrorResponse('INTERNAL_ERROR', 'CLOUDFLARE_API_TOKEN is not set');
    }

    const payload: WebhookPayload = await req.json();
    const { type, record, old_record } = payload;

    console.log(`Processing ${type} for subdomain: ${record?.subdomain || old_record?.subdomain}`);

    if (type === 'INSERT' && record) {
      await addDomain(record.subdomain, apiToken);
    } 
    else if (type === 'DELETE') {
      const subdomainToDelete = record?.subdomain || old_record?.subdomain;
      if (subdomainToDelete) {
        await deleteDomain(subdomainToDelete, apiToken);
      } else {
        console.warn("Delete triggered but no subdomain found in record or old_record.");
      }
    } 
    else if (type === 'UPDATE' && old_record) {
      if (record.subdomain !== old_record.subdomain) {
        console.log(`Subdomain changed from ${old_record.subdomain} to ${record.subdomain}`);
        // Delete old, add new
        await deleteDomain(old_record.subdomain, apiToken);
        await addDomain(record.subdomain, apiToken);
      } else {
        console.log("Subdomain did not change, skipping Cloudflare update.");
      }
    }

    const httpResponse = new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

    return addRateLimitHeaders(httpResponse, rateLimitResult.rateLimitResult);
  },
  { statusCode: 500, includeRequestId: true }
);

async function addDomain(subdomain: string, token: string) {
  const fullDomain = `${subdomain}.${BASE_DOMAIN}`;
  console.log(`Adding domain: ${fullDomain}`);

  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/projects/${CLOUDFLARE_PROJECT_NAME}/domains`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: fullDomain }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.errors?.[0]?.code === 10045) {
      console.log(`Domain ${fullDomain} already exists in project.`);
      return;
    }
    throw new Error(`Cloudflare API error (Add): ${JSON.stringify(error)}`);
  }
  console.log(`Successfully added ${fullDomain}`);
}

async function deleteDomain(subdomain: string, token: string) {
  const fullDomain = `${subdomain}.${BASE_DOMAIN}`;
  console.log(`Deleting domain: ${fullDomain}`);

  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/projects/${CLOUDFLARE_PROJECT_NAME}/domains/${fullDomain}`;
  
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.errors?.[0]?.code === 10046) {
      console.log(`Domain ${fullDomain} not found in project, skipping delete.`);
      return;
    }
    throw new Error(`Cloudflare API error (Delete): ${JSON.stringify(error)}`);
  }
  console.log(`Successfully deleted ${fullDomain}`);
}

if (import.meta.main) {
  serve(manageAppDomainsHandler);
}
