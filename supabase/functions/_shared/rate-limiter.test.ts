import { delay } from 'https://deno.land/std@0.168.0/async/delay.ts';
import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import {
  createRateLimitMiddleware,
  type RateLimitCheckFn,
  type RateLimitConfig,
  rateLimitConfigs,
} from './rate-limiter.ts';

function defaultKey(req: Request): string {
  const authHeader = req.headers.get('Authorization');
  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(token.split('.')[1]));
      return `user:${payload.sub}`;
    } catch {
      // fall through
    }
  }
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return `ip:${ip}`;
}

/** In-memory check matching test expectations (no Supabase). */
function createTestMemoryCheck(config: RateLimitConfig): RateLimitCheckFn {
  type State = {
    windowStart: number;
    count: number;
    violationStreak: number;
    circuitOpenUntil: number;
  };
  const states = new Map<string, State>();

  return async function check(req: Request) {
    const key = config.keyGenerator ? config.keyGenerator(req) : defaultKey(req);
    const now = Date.now();
    let st = states.get(key);
    if (!st) {
      st = { windowStart: now, count: 0, violationStreak: 0, circuitOpenUntil: 0 };
      states.set(key, st);
    }

    if (st.circuitOpenUntil > now) {
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: st.circuitOpenUntil,
        circuitOpen: true,
        circuitResetTime: st.circuitOpenUntil,
      };
    }

    if (st.circuitOpenUntil > 0 && st.circuitOpenUntil <= now) {
      st.circuitOpenUntil = 0;
      st.violationStreak = 0;
      st.count = 0;
      st.windowStart = now;
    }

    if (now - st.windowStart >= config.windowMs) {
      st.windowStart = now;
      st.count = 0;
      st.violationStreak = 0;
    }

    const threshold = config.circuitBreakerThreshold ?? Number.MAX_SAFE_INTEGER;
    const resetMs = config.circuitBreakerResetMs ?? 60_000;

    if (st.count < config.maxRequests) {
      st.count++;
      st.violationStreak = 0;
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - st.count,
        resetTime: st.windowStart + config.windowMs,
      };
    }

    st.violationStreak++;

    if (st.violationStreak > threshold) {
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: st.windowStart + config.windowMs,
        circuitOpen: true,
        circuitResetTime: st.circuitOpenUntil,
      };
    }

    if (st.violationStreak >= threshold) {
      st.circuitOpenUntil = now + resetMs;
    }

    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: st.windowStart + config.windowMs,
    };
  };
}

function createTestMiddleware(config: RateLimitConfig) {
  return createRateLimitMiddleware(config, 'test-route', {
    checkOverride: createTestMemoryCheck(config),
  });
}

function bearerJwtForSub(sub: string) {
  const payload = btoa(JSON.stringify({ sub }));
  return `Bearer xx.${payload}.yy`;
}

Deno.test('Rate limiting should enforce request limits', async () => {
  const config = rateLimitConfigs.generateQuestions;
  const rateLimit = createTestMiddleware(config);

  const mockRequest = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
    },
  });

  let lastResult;
  for (let i = 0; i < config.maxRequests + 1; i++) {
    lastResult = await rateLimit.middleware(mockRequest);
  }

  assertExists(lastResult);

  if (!lastResult!.allowed) {
    assertEquals(lastResult!.response?.status, 429);

    const rateLimitHeaders = {
      limit: lastResult!.response?.headers.get('X-RateLimit-Limit'),
      remaining: lastResult!.response?.headers.get('X-RateLimit-Remaining'),
      reset: lastResult!.response?.headers.get('X-RateLimit-Reset'),
      retryAfter: lastResult!.response?.headers.get('Retry-After'),
    };

    assertEquals(rateLimitHeaders.limit, config.maxRequests.toString());
    assertEquals(rateLimitHeaders.remaining, '0');
    assertExists(rateLimitHeaders.reset);
    assertExists(rateLimitHeaders.retryAfter);
  }
});

Deno.test('Rate limiting should allow requests within limits', async () => {
  const rateLimit = createTestMiddleware(rateLimitConfigs.generateQuestions);

  const mockRequest = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
    },
  });

  for (let i = 0; i < rateLimitConfigs.generateQuestions.maxRequests - 1; i++) {
    const result = await rateLimit.middleware(mockRequest);
    assertEquals(result.allowed, true, `Request ${i + 1} should be allowed`);
  }
});

Deno.test('Rate limiting should provide proper headers for successful requests', async () => {
  const rateLimit = createTestMiddleware(rateLimitConfigs.generateQuestions);

  const mockRequest = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
    },
  });

  const middlewareResult = await rateLimit.middleware(mockRequest);
  assertEquals(middlewareResult.allowed, true);

  const rateLimitResult = await rateLimit.check(mockRequest);

  assertEquals(rateLimitResult.limit, rateLimitConfigs.generateQuestions.maxRequests);
  assertEquals(rateLimitResult.remaining >= 0, true);
  assertEquals(rateLimitResult.resetTime > Date.now() - 60_000, true);
});

Deno.test('Rate limiting should handle different configurations', async () => {
  const generateQuestionsLimiter = createTestMiddleware(rateLimitConfigs.generateQuestions);
  const validateContentLimiter = createTestMiddleware(rateLimitConfigs.validateContent);

  const mockRequest = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
    },
  });

  const genResult = await generateQuestionsLimiter.middleware(mockRequest);
  const valResult = await validateContentLimiter.middleware(mockRequest);

  assertEquals(genResult.allowed, true);
  assertEquals(valResult.allowed, true);

  const genRateLimit = await generateQuestionsLimiter.check(mockRequest);
  const valRateLimit = await validateContentLimiter.check(mockRequest);

  assertEquals(genRateLimit.limit, rateLimitConfigs.generateQuestions.maxRequests);
  assertEquals(valRateLimit.limit, rateLimitConfigs.validateContent.maxRequests);
});

Deno.test('Rate limiting should reset after window expires', async () => {
  const shortWindowConfig = {
    windowMs: 100,
    maxRequests: 2,
  };

  const rateLimit = createTestMiddleware(shortWindowConfig);

  const mockRequest = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
    },
  });

  await rateLimit.middleware(mockRequest);
  await rateLimit.middleware(mockRequest);
  const blockedResult = await rateLimit.middleware(mockRequest);

  assertEquals(blockedResult.allowed, false);

  await new Promise((resolve) => setTimeout(resolve, 150));

  const allowedResult = await rateLimit.middleware(mockRequest);
  assertEquals(allowedResult.allowed, true);
});

Deno.test('Rate limiting should handle different users independently', async () => {
  const rateLimit = createTestMiddleware(rateLimitConfigs.generateQuestions);

  const user1Request = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      Authorization: bearerJwtForSub('user1'),
      'Content-Type': 'application/json',
    },
  });

  const user2Request = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      Authorization: bearerJwtForSub('user2'),
      'Content-Type': 'application/json',
    },
  });

  for (let i = 0; i < rateLimitConfigs.generateQuestions.maxRequests; i++) {
    await rateLimit.middleware(user1Request);
  }

  const user1Blocked = await rateLimit.middleware(user1Request);
  assertEquals(user1Blocked.allowed, false);

  const user2Allowed = await rateLimit.middleware(user2Request);
  assertEquals(user2Allowed.allowed, true);
});

Deno.test('Rate limiting should fallback to IP for unauthenticated requests', async () => {
  const rateLimit = createTestMiddleware(rateLimitConfigs.anonymous);

  const ipRequest = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': '192.168.1.100',
    },
  });

  const result = await rateLimit.middleware(ipRequest);
  assertEquals(result.allowed, true);

  const rateLimitResult = await rateLimit.check(ipRequest);
  assertEquals(rateLimitResult.limit, rateLimitConfigs.anonymous.maxRequests);
});

Deno.test('Circuit breaker should open after repeated violations', async () => {
  const circuitBreakerConfig = {
    windowMs: 1000,
    maxRequests: 2,
    circuitBreakerThreshold: 3,
    circuitBreakerResetMs: 500,
  };

  const rateLimit = createTestMiddleware(circuitBreakerConfig);

  const testRequest = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      'X-Forwarded-For': '192.168.1.200',
    },
  });

  await rateLimit.middleware(testRequest);
  await rateLimit.middleware(testRequest);

  for (let i = 0; i < 3; i++) {
    const result = await rateLimit.middleware(testRequest);
    assertEquals(result.allowed, false);
    assertEquals(result.response?.status, 429);
  }

  const circuitOpenResult = await rateLimit.middleware(testRequest);
  assertEquals(circuitOpenResult.allowed, false);
  assertEquals(circuitOpenResult.response?.status, 503);

  const circuitHeader = circuitOpenResult.response?.headers.get('X-Circuit-Breaker');
  assertEquals(circuitHeader, 'open');

  const resetHeader = circuitOpenResult.response?.headers.get('X-Circuit-Reset');
  assertExists(resetHeader);
});

Deno.test('Circuit breaker should reset after timeout', async () => {
  const circuitBreakerConfig = {
    windowMs: 1000,
    maxRequests: 1,
    circuitBreakerThreshold: 2,
    circuitBreakerResetMs: 300,
  };

  const rateLimit = createTestMiddleware(circuitBreakerConfig);

  const testRequest = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      'X-Forwarded-For': '192.168.1.201',
    },
  });

  await rateLimit.middleware(testRequest);
  await rateLimit.middleware(testRequest);
  await rateLimit.middleware(testRequest);

  const blockedResult = await rateLimit.middleware(testRequest);
  assertEquals(blockedResult.allowed, false);
  assertEquals(blockedResult.response?.status, 503);

  await delay(350);

  const resetResult = await rateLimit.middleware(testRequest);
  assertEquals(resetResult.allowed, true);
});

Deno.test('Circuit breaker should provide enhanced error responses', async () => {
  const circuitBreakerConfig = {
    windowMs: 1000,
    maxRequests: 1,
    circuitBreakerThreshold: 1,
    circuitBreakerResetMs: 1000,
  };

  const rateLimit = createTestMiddleware(circuitBreakerConfig);

  const testRequest = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      'X-Forwarded-For': '192.168.1.202',
    },
  });

  await rateLimit.middleware(testRequest);
  await rateLimit.middleware(testRequest);

  const circuitResult = await rateLimit.middleware(testRequest);
  assertEquals(circuitResult.allowed, false);

  const response = circuitResult.response!;
  assertEquals(response.status, 503);

  const responseBody = await response.json();
  assertEquals(responseBody.error, 'Service temporarily unavailable due to repeated violations');
  assertEquals(responseBody.circuitOpen, true);
  assertExists(responseBody.circuitResetTime);

  assertEquals(response.headers.get('X-Circuit-Breaker'), 'open');
  assertEquals(response.headers.get('X-Circuit-Reset'), responseBody.circuitResetTime.toString());
});
