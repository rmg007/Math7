import { createSanitizedErrorResponse } from './error-sanitizer.ts';

/**
 * Checks if the request is targeting the correct environment.
 * Prevents cross-environment calls if a tenant or client accidentally uses the wrong URL.
 */
export async function checkEnvironmentGuard(req: Request): Promise<Response | null> {
  const targetEnv = req.headers.get('X-App-Env') || (await getBodyEnv(req));
  const currentEnv = Deno.env.get('APP_ENV');

  if (targetEnv && currentEnv && targetEnv !== currentEnv) {
    console.warn(`Blocked cross-environment call: Target=${targetEnv}, Current=${currentEnv}`);
    return createSanitizedErrorResponse('FORBIDDEN', `Environment mismatch: Target environment is ${targetEnv}, but this service is running in ${currentEnv}.`);
  }

  return null;
}

async function getBodyEnv(req: Request): Promise<string | null> {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return null;
  }

  try {
    // Clone the request as we can only read the body once
    const clone = req.clone();
    const body = await clone.json();
    return body.p_env || body.env || null;
  } catch {
    return null;
  }
}
