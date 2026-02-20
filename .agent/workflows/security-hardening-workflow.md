# Security Hardening Workflow

This document outlines the security hardening workflow implemented for Questerix. All coding agents should follow these patterns when working on security-sensitive features.

## 🚨 IMMEDIATE SECURITY REQUIREMENTS

### 1. CORS Policy (SEC-001)
**NEVER** use wildcard origins. Always specify exact allowed origins:

```typescript
// ❌ WRONG
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ CORRECT  
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};
```

### 2. Rate Limiting (SEC-002)
**ALWAYS** implement rate limiting on resource-intensive endpoints:

```typescript
import { createRateLimitMiddleware, rateLimitConfigs } from '../_shared/rate-limiter.ts';

// In your edge function
const rateLimit = createRateLimitMiddleware(rateLimitConfigs.yourEndpoint);
const rateLimitResult = rateLimit.middleware(req);

if (!rateLimitResult.allowed) {
  return rateLimitResult.response!;
}

// For successful responses, add rate limit headers
const finalRateLimitResult = rateLimit.check(req);
return addRateLimitHeaders(response, finalRateLimitResult);
```

### 3. Input Sanitization (SEC-003)
**ALWAYS** sanitize user inputs, especially for AI/LLM endpoints:

```typescript
import { validateGenerationRequest } from '../_shared/input-sanitizer.ts';

const validation = validateGenerationRequest(request);
if (!validation.isValid) {
  return createSanitizedErrorResponse('BAD_REQUEST', validation.errors.join(', '));
}

// Use sanitized request
const sanitizedRequest = validation.sanitizedRequest!;
```

### 4. Error Sanitization (SEC-005)
**NEVER** leak internal information in error responses:

```typescript
import { withErrorSanitization } from '../_shared/error-sanitizer.ts';

export const handler = withErrorSanitization(
  async (req: Request) => {
    // Your logic here
    // Errors will be automatically sanitized
  },
  { statusCode: 500, includeRequestId: true }
);
```

## 📋 SECURITY CHECKLIST

Before deploying any code changes, verify:

- [ ] CORS policy uses specific origins (no wildcards)
- [ ] Rate limiting implemented on resource-intensive endpoints  
- [ ] Input validation and sanitization for all user inputs
- [ ] Error responses are sanitized (no internal details)
- [ ] Security headers are present (CSP, HSTS, X-Frame-Options, etc.)
- [ ] Request tracking IDs are added for monitoring
- [ ] Comprehensive test coverage for security controls

## 🧪 TESTING REQUIREMENTS

### Create Security Tests
For every security fix, create corresponding regression tests:

```typescript
Deno.test('SECURITY-ISSUE-NAME: Description of what should not happen', async () => {
  // Test the security control
  const result = await yourSecurityFunction(maliciousInput);
  
  // Verify it's properly blocked or sanitized
  assertFalse(result.includes('dangerous-content'));
});
```

### Test Categories
1. **Input Validation Tests** - Test malicious inputs are blocked
2. **Rate Limiting Tests** - Test excessive requests are blocked  
3. **CORS Tests** - Test unauthorized origins are rejected
4. **Error Sanitization Tests** - Test no sensitive info leaks
5. **Authentication Tests** - Test unauthorized access is blocked

### Run Security Tests
```bash
# Run all security tests
./scripts/run-security-tests.ps1

# Or run individual test files
deno test supabase/functions/_shared/rate-limiter.test.ts --allow-read --allow-net --allow-env
```

## 🔧 CODE PATTERNS

### Edge Function Template
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createRateLimitMiddleware, rateLimitConfigs } from '../_shared/rate-limiter.ts';
import { validateGenerationRequest } from '../_shared/input-sanitizer.ts';
import { withErrorSanitization, createSanitizedErrorResponse } from '../_shared/error-sanitizer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

export const yourHandler = withErrorSanitization(
  async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Rate limiting check
    const rateLimit = createRateLimitMiddleware(rateLimitConfigs.yourEndpoint);
    const rateLimitResult = rateLimit.middleware(req);
    
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createSanitizedErrorResponse('UNAUTHORIZED', 'Missing authorization header');
    }

    // Input validation
    const requestData = await req.json();
    const validation = validateYourRequest(requestData);
    
    if (!validation.isValid) {
      return createSanitizedErrorResponse('BAD_REQUEST', validation.errors.join(', '));
    }

    // Your business logic here
    const result = await yourBusinessLogic(validation.sanitizedRequest);

    // Return response with rate limit headers
    const finalRateLimitResult = rateLimit.check(req);
    return addRateLimitHeaders(
      new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }),
      finalRateLimitResult
    );
  },
  { statusCode: 500, includeRequestId: true }
);

if (import.meta.main) {
  serve(yourHandler);
}
```

## 🚨 SECURITY INCIDENT RESPONSE

If you discover a security vulnerability:

1. **IMMEDIATELY** stop and assess the impact
2. **DO NOT** commit the fix to main branch
3. **CREATE** a security branch with the fix
4. **ADD** comprehensive regression tests
5. **DOCUMENT** the issue in LEARNING_LOG.md
6. **FOLLOW** the security patterns in this document
7. **REQUEST** security review before merging

## 📚 REFERENCE DOCUMENTATION

- **Security Utilities**: `supabase/functions/_shared/`
- **Security Tests**: `supabase/functions/*/security.test.ts`
- **Learning Log**: `docs/LEARNING_LOG.md`
- **Security Headers**: `admin-panel/public/_headers`

## ⚠️ CRITICAL WARNINGS

- **NEVER** use `Access-Control-Allow-Origin: *`
- **NEVER** interpolate user input directly into prompts
- **NEVER** expose internal errors to clients
- **ALWAYS** implement rate limiting on AI endpoints
- **ALWAYS** sanitize user inputs
- **ALWAYS** create regression tests for security fixes

---

**Remember**: Security is everyone's responsibility. When in doubt, ask for security review before deploying.
