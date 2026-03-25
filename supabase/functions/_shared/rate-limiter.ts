// Rate limiting middleware for Supabase Edge Functions
// Enhanced rate limiter with persistence and circuit breaker
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  // New: Persistence and circuit breaker options
  persistToRedis?: boolean;
  redisUrl?: string;
  circuitBreakerThreshold?: number;
  circuitBreakerResetMs?: number;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  // New: Circuit breaker state
  circuitOpen?: boolean;
  circuitResetTime?: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced rate limiter with persistence and circuit breaking
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private circuitBreakers = new Map<string, { failureCount: number; isOpen: boolean; resetTime: number }>();
  private redis?: any; // Redis client (optional)

  constructor(private config: RateLimitConfig) {
    // Initialize Redis if configured
    if (config.persistToRedis && config.redisUrl) {
      // Note: Redis client initialization would go here
      // For now, we'll fall back to in-memory with warnings
      console.warn('Redis persistence requested but not implemented. Using in-memory fallback.');
    }
  }

  check(req: Request): RateLimitResult {
    const key = this.config.keyGenerator ? this.config.keyGenerator(req) : this.getDefaultKey(req);
    const now = Date.now();

    // Check circuit breaker first
    const circuitState = this.circuitBreakers.get(key);
    if (circuitState) {
      // Expire sub-threshold failures so counts don't accumulate forever
      if (!circuitState.isOpen && now >= circuitState.resetTime) {
        this.circuitBreakers.delete(key);
      }
    }

    const activeCircuit = this.circuitBreakers.get(key);
    if (activeCircuit?.isOpen) {
      if (now < activeCircuit.resetTime) {
        return {
          allowed: false,
          limit: this.config.maxRequests,
          remaining: 0,
          resetTime: activeCircuit.resetTime,
          circuitOpen: true,
          circuitResetTime: activeCircuit.resetTime
        };
      } else {
        // Reset circuit breaker
        this.circuitBreakers.delete(key);
      }
    }

    // Clean up expired entries
    for (const [k, v] of this.requests.entries()) {
      if (v.resetTime < now) {
        this.requests.delete(k);
      }
    }

    const current = this.requests.get(key);
    
    if (!current || current.resetTime < now) {
      // New window or expired entry
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return {
        allowed: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      };
    }

    if (current.count >= this.config.maxRequests) {
      // Trigger circuit breaker if configured
      if (this.config.circuitBreakerThreshold) {
        const existing = this.circuitBreakers.get(key);
        const failureCount = (existing?.failureCount || 0) + 1;
        
        if (failureCount >= this.config.circuitBreakerThreshold) {
          const cbResetTime = now + (this.config.circuitBreakerResetMs || 60000);
          this.circuitBreakers.set(key, {
            failureCount,
            isOpen: true,
            resetTime: cbResetTime
          });
          
          return {
            allowed: false,
            limit: this.config.maxRequests,
            remaining: 0,
            resetTime: cbResetTime,
            circuitOpen: true,
            circuitResetTime: cbResetTime
          };
        }
        
        // Persist sub-threshold failure count so it accumulates
        this.circuitBreakers.set(key, {
          failureCount,
          isOpen: false,
          resetTime: now + (this.config.circuitBreakerResetMs || 60000)
        });
      }
      
      return {
        allowed: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: current.resetTime,
      };
    }

    current.count++;
    return {
      allowed: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - current.count,
      resetTime: current.resetTime,
    };
  }

  private getDefaultKey(req: Request): string {
    // Use user ID from JWT if available, otherwise IP
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        // Extract user ID from JWT token (simplified)
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        return `user:${payload.sub}`;
      } catch {
        // Fallback to IP if token parsing fails
      }
    }
    
    // Fallback to IP address
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    return `ip:${ip}`;
  }
}

// Rate limit configurations with circuit breaker settings
export const rateLimitConfigs = {
  generateQuestions: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute per user
    circuitBreakerThreshold: 5, // Open circuit after 5 violations
    circuitBreakerResetMs: 5 * 60 * 1000, // 5 minutes reset
  },
  validateContent: {
    windowMs: 60 * 1000, // 1 minute  
    maxRequests: 20, // 20 requests per minute per user
    circuitBreakerThreshold: 8, // Open circuit after 8 violations
    circuitBreakerResetMs: 2 * 60 * 1000, // 2 minutes reset
  },
  // More restrictive for anonymous requests
  anonymous: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute per IP
    circuitBreakerThreshold: 3, // Open circuit after 3 violations
    circuitBreakerResetMs: 10 * 60 * 1000, // 10 minutes reset
  },
};

// Rate limiting middleware
export function createRateLimitMiddleware(config: RateLimitConfig) {
  const limiter = new RateLimiter(config);
  
  return {
    check: (req: Request): RateLimitResult => limiter.check(req),
    middleware: (req: Request): { allowed: boolean; remaining: number; response?: Response; rateLimitResult: RateLimitResult } => {
      const result = limiter.check(req);
      
      if (!result.allowed) {
        // Enhanced error response for circuit breaker
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
              status: result.circuitOpen ? 503 : 429, // Service Unavailable for circuit breaker
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
    }
  };
}

// Helper to add rate limit headers to successful responses
export function addRateLimitHeaders(response: Response, result: RateLimitResult): Response {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
  return response;
}
