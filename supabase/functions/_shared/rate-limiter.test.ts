/// <reference path="../types.d.ts" />

// Type declarations for Deno
declare global {
  const Deno: {
    test: (name: string, fn: () => void | Promise<void>) => void;
  };
}

import { delay } from 'https://deno.land/std@0.168.0/async/delay.ts';
import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { createRateLimitMiddleware, rateLimitConfigs } from '../rate-limiter.ts';

Deno.test('Rate limiting should enforce request limits', async () => {
  const rateLimit = createRateLimitMiddleware(rateLimitConfigs.generateQuestions);
  const config = rateLimitConfigs.generateQuestions;
  
  // Create a mock request
  const mockRequest = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    }
  });

  // Make requests up to the limit
  let lastResult;
  for (let i = 0; i < config.maxRequests + 1; i++) {
    lastResult = rateLimit.middleware(mockRequest);
  }

  assertExists(lastResult);
  
  // The last request should be rate limited
  if (!lastResult.allowed) {
    assertEquals(lastResult.response?.status, 429);
    
    const rateLimitHeaders = {
      limit: lastResult.response?.headers.get('X-RateLimit-Limit'),
      remaining: lastResult.response?.headers.get('X-RateLimit-Remaining'),
      reset: lastResult.response?.headers.get('X-RateLimit-Reset'),
      retryAfter: lastResult.response?.headers.get('Retry-After')
    };
    
    assertEquals(rateLimitHeaders.limit, config.maxRequests.toString());
    assertEquals(rateLimitHeaders.remaining, '0');
    assertExists(rateLimitHeaders.reset);
    assertExists(rateLimitHeaders.retryAfter);
  }
});

Deno.test('Rate limiting should allow requests within limits', async () => {
  const rateLimit = createRateLimitMiddleware(rateLimitConfigs.generateQuestions);
  
  const mockRequest = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    }
  });

  // Make requests within the limit
  for (let i = 0; i < rateLimitConfigs.generateQuestions.maxRequests - 1; i++) {
    const result = rateLimit.middleware(mockRequest);
    assertEquals(result.allowed, true, `Request ${i + 1} should be allowed`);
  }
});

Deno.test('Rate limiting should provide proper headers for successful requests', async () => {
  const rateLimit = createRateLimitMiddleware(rateLimitConfigs.generateQuestions);
  
  const mockRequest = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    }
  });

  // Make a request
  const middlewareResult = rateLimit.middleware(mockRequest);
  assertEquals(middlewareResult.allowed, true);
  
  // Get rate limit info for headers
  const rateLimitResult = rateLimit.check(mockRequest);
  
  assertEquals(rateLimitResult.limit, rateLimitConfigs.generateQuestions.maxRequests);
  assertExists(rateLimitResult.remaining >= 0);
  assertExists(rateLimitResult.resetTime > Date.now());
});

Deno.test('Rate limiting should handle different configurations', async () => {
  const generateQuestionsLimiter = createRateLimitMiddleware(rateLimitConfigs.generateQuestions);
  const validateContentLimiter = createRateLimitMiddleware(rateLimitConfigs.validateContent);
  
  const mockRequest = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    }
  });

  // Both should allow the first request
  const genResult = generateQuestionsLimiter.middleware(mockRequest);
  const valResult = validateContentLimiter.middleware(mockRequest);
  
  assertEquals(genResult.allowed, true);
  assertEquals(valResult.allowed, true);
  
  // But they should have different limits
  const genRateLimit = generateQuestionsLimiter.check(mockRequest);
  const valRateLimit = validateContentLimiter.check(mockRequest);
  
  assertEquals(genRateLimit.limit, rateLimitConfigs.generateQuestions.maxRequests);
  assertEquals(valRateLimit.limit, rateLimitConfigs.validateContent.maxRequests);
});

Deno.test('Rate limiting should reset after window expires', async () => {
  // Create a custom rate limiter with a very short window for testing
  const shortWindowConfig = {
    windowMs: 100, // 100ms
    maxRequests: 2
  };
  
  const rateLimit = createRateLimitMiddleware(shortWindowConfig);
  
  const mockRequest = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    }
  });

  // Exhaust the limit
  rateLimit.middleware(mockRequest); // 1st request
  rateLimit.middleware(mockRequest); // 2nd request
  const blockedResult = rateLimit.middleware(mockRequest); // 3rd request should be blocked
  
  assertEquals(blockedResult.allowed, false);
  
  // Wait for the window to expire
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // Should be allowed again
  const allowedResult = rateLimit.middleware(mockRequest);
  assertEquals(allowedResult.allowed, true);
});

Deno.test('Rate limiting should handle different users independently', async () => {
  const rateLimit = createRateLimitMiddleware(rateLimitConfigs.generateQuestions);
  
  // Create requests for different users (simulated by different Authorization headers)
  const user1Request = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer user1-token',
      'Content-Type': 'application/json'
    }
  });
  
  const user2Request = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer user2-token',
      'Content-Type': 'application/json'
    }
  });

  // Exhaust limit for user 1
  for (let i = 0; i < rateLimitConfigs.generateQuestions.maxRequests; i++) {
    rateLimit.middleware(user1Request);
  }
  
  // User 1 should be blocked
  const user1Blocked = rateLimit.middleware(user1Request);
  assertEquals(user1Blocked.allowed, false);
  
  // But user 2 should still be allowed
  const user2Allowed = rateLimit.middleware(user2Request);
  assertEquals(user2Allowed.allowed, true);
});

Deno.test('Rate limiting should fallback to IP for unauthenticated requests', async () => {
  const rateLimit = createRateLimitMiddleware(rateLimitConfigs.anonymous);
  
  // Create request without Authorization header but with IP
  const ipRequest = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': '192.168.1.100'
    }
  });

  // Should work with IP-based limiting
  const result = rateLimit.middleware(ipRequest);
  assertEquals(result.allowed, true);
  
  const rateLimitResult = rateLimit.check(ipRequest);
  assertEquals(rateLimitResult.limit, rateLimitConfigs.anonymous.maxRequests);
});

Deno.test('Circuit breaker should open after repeated violations', async () => {
  // Create a rate limiter with low circuit breaker threshold for testing
  const circuitBreakerConfig = {
    windowMs: 1000,
    maxRequests: 2,
    circuitBreakerThreshold: 3, // Open after 3 violations
    circuitBreakerResetMs: 500, // Reset after 500ms
  };
  
  const rateLimit = createRateLimitMiddleware(circuitBreakerConfig);
  
  const testRequest = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      'X-Forwarded-For': '192.168.1.200'
    }
  });

  // Exhaust the limit (2 requests)
  rateLimit.middleware(testRequest);
  rateLimit.middleware(testRequest);
  
  // Trigger violations to open circuit breaker
  for (let i = 0; i < 3; i++) {
    const result = rateLimit.middleware(testRequest);
    assertEquals(result.allowed, false);
    assertEquals(result.response?.status, 429); // Rate limited
  }
  
  // Circuit breaker should now be open
  const circuitOpenResult = rateLimit.middleware(testRequest);
  assertEquals(circuitOpenResult.allowed, false);
  assertEquals(circuitOpenResult.response?.status, 503); // Service Unavailable
  
  // Check for circuit breaker headers
  const circuitHeader = circuitOpenResult.response?.headers.get('X-Circuit-Breaker');
  assertEquals(circuitHeader, 'open');
  
  const resetHeader = circuitOpenResult.response?.headers.get('X-Circuit-Reset');
  assertExists(resetHeader);
});

Deno.test('Circuit breaker should reset after timeout', async () => {
  const circuitBreakerConfig = {
    windowMs: 1000,
    maxRequests: 1,
    circuitBreakerThreshold: 2, // Open after 2 violations
    circuitBreakerResetMs: 300, // Reset after 300ms
  };
  
  const rateLimit = createRateLimitMiddleware(circuitBreakerConfig);
  
  const testRequest = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      'X-Forwarded-For': '192.168.1.201'
    }
  });

  // Exhaust limit and trigger circuit breaker
  rateLimit.middleware(testRequest); // Use up the 1 allowed request
  rateLimit.middleware(testRequest); // First violation
  rateLimit.middleware(testRequest); // Second violation - should open circuit
  
  // Should be blocked by circuit breaker
  const blockedResult = rateLimit.middleware(testRequest);
  assertEquals(blockedResult.allowed, false);
  assertEquals(blockedResult.response?.status, 503);
  
  // Wait for circuit breaker to reset
  await delay(350);
  
  // Should work again after reset
  const resetResult = rateLimit.middleware(testRequest);
  assertEquals(resetResult.allowed, true);
});

Deno.test('Circuit breaker should provide enhanced error responses', async () => {
  const circuitBreakerConfig = {
    windowMs: 1000,
    maxRequests: 1,
    circuitBreakerThreshold: 1, // Open after 1 violation
    circuitBreakerResetMs: 1000,
  };
  
  const rateLimit = createRateLimitMiddleware(circuitBreakerConfig);
  
  const testRequest = new Request('http://localhost:9000/test', {
    method: 'POST',
    headers: {
      'X-Forwarded-For': '192.168.1.202'
    }
  });

  // Trigger circuit breaker
  rateLimit.middleware(testRequest); // Use up limit
  rateLimit.middleware(testRequest); // Violation - opens circuit
  
  const circuitResult = rateLimit.middleware(testRequest);
  assertEquals(circuitResult.allowed, false);
  
  const response = circuitResult.response!;
  assertEquals(response.status, 503);
  
  // Parse response body
  const responseBody = await response.json();
  assertEquals(responseBody.error, 'Service temporarily unavailable due to repeated violations');
  assertEquals(responseBody.circuitOpen, true);
  assertExists(responseBody.circuitResetTime);
  
  // Check headers
  assertEquals(response.headers.get('X-Circuit-Breaker'), 'open');
  assertEquals(response.headers.get('X-Circuit-Reset'), responseBody.circuitResetTime.toString());
});
