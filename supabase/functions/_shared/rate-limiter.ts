import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  circuitBreakerThreshold?: number;
  circuitBreakerResetMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  circuitOpen?: boolean;
  circuitResetTime?: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

class DatabaseRateLimiter {
  private supabase: SupabaseClient;

  constructor(private config: RateLimitConfig, private routeName: string) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async check(req: Request): Promise<RateLimitResult> {
    const key = this.config.keyGenerator ? this.config.keyGenerator(req) : this.getDefaultKey(req);

    const { data, error } = await this.supabase.rpc('check_rate_limit', {
      p_key: key,
      p_route: this.routeName,
      p_window_ms: this.config.windowMs,
      p_max_requests: this.config.maxRequests,
      p_circuit_threshold: this.config.circuitBreakerThreshold ?? null,
      p_circuit_reset_ms: this.config.circuitBreakerResetMs ?? null,
    });

    if (error) {
      console.error('Rate limit check failed:', error);
      // Fail open on DB errors to avoid blocking legitimate traffic
      return {
        allowed: true,
        limit: this.config.maxRequests,
        remaining: 1,
        resetTime: Date.now() + this.config.windowMs,
      };
    }

    return data as RateLimitResult;
  }

  private getDefaultKey(req: Request): string {
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        return `user:${payload.sub}`;
      } catch {
        // Fallback
      }
    }

    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    return `ip:${ip}`;
  }
}

export const rateLimitConfigs = {
  generateQuestions: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    circuitBreakerThreshold: 5,
    circuitBreakerResetMs: 5 * 60 * 1000,
  },
  validateContent: {
    windowMs: 60 * 1000,
    maxRequests: 20,
    circuitBreakerThreshold: 8,
    circuitBreakerResetMs: 2 * 60 * 1000,
  },
  anonymous: {
    windowMs: 60 * 1000,
    maxRequests: 5,
    circuitBreakerThreshold: 3,
    circuitBreakerResetMs: 10 * 60 * 1000,
  },
};

export type RateLimitCheckFn = (req: Request) => Promise<RateLimitResult>;

export function createRateLimitMiddleware(
  config: RateLimitConfig,
  routeName: string = 'default',
  options?: { checkOverride?: RateLimitCheckFn }
) {
  let limiter: DatabaseRateLimiter | null = null;

  const getLimiter = () => {
    if (!limiter) {
      limiter = new DatabaseRateLimiter(config, routeName);
    }
    return limiter;
  };

  const resolveCheck = (req: Request) =>
    options?.checkOverride ? options.checkOverride(req) : getLimiter().check(req);

  return {
    check: (req: Request) => resolveCheck(req),
    middleware: async (
      req: Request
    ): Promise<{
      allowed: boolean;
      remaining: number;
      response?: Response;
      rateLimitResult: RateLimitResult;
    }> => {
      const result = await resolveCheck(req);

      if (!result.allowed) {
        const errorMessage = result.circuitOpen
          ? 'Service temporarily unavailable due to repeated violations'
          : 'Rate limit exceeded';

        return {
          allowed: false,
          remaining: 0,
          rateLimitResult: result,
          response: new Response(
            JSON.stringify({
              error: errorMessage,
              limit: result.limit,
              resetTime: result.resetTime,
              circuitOpen: result.circuitOpen,
              circuitResetTime: result.circuitResetTime,
            }),
            {
              status: result.circuitOpen ? 503 : 429,
              headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': result.limit.toString(),
                'X-RateLimit-Remaining': result.remaining.toString(),
                'X-RateLimit-Reset': result.resetTime.toString(),
                'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
                ...corsHeaders,
                ...(result.circuitOpen && {
                  'X-Circuit-Breaker': 'open',
                  'X-Circuit-Reset': result.circuitResetTime?.toString(),
                }),
              },
            }
          ),
        };
      }

      return { allowed: true, remaining: result.remaining, rateLimitResult: result };
    },
  };
}

export function addRateLimitHeaders(response: Response, result: RateLimitResult): Response {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
  return response;
}
