/// <reference path="../types.d.ts" />
import { assertEquals, assertExists, assertFalse, assertTrue } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { createSanitizedError, createSanitizedErrorResponse, ErrorTypes, sanitizeError, withErrorSanitization } from '../error-sanitizer.ts';

Deno.test('Error sanitization should prevent information disclosure', () => {
  const sensitiveErrors = [
    new Error('Database connection failed: host=db.example.com port=5432'),
    new Error('SQL query failed: SELECT * FROM users WHERE password = \'admin\''),
    new Error('Private key exposed: -----BEGIN RSA PRIVATE KEY-----'),
    new Error('Internal server error: NullPointerException at com.example.Service'),
    new Error('Stack trace: Error: test\n    at test.js:10:5\n    at test.js:20:10'),
  ];

  for (const error of sensitiveErrors) {
    const sanitized = sanitizeError(error);
    
    // Should not contain sensitive information
    assertFalse(sanitized.message.toLowerCase().includes('database'));
    assertFalse(sanitized.message.toLowerCase().includes('sql'));
    assertFalse(sanitized.message.toLowerCase().includes('password'));
    assertFalse(sanitized.message.toLowerCase().includes('private key'));
    assertFalse(sanitized.message.toLowerCase().includes('stack trace'));
    
    // Should have generic message for server errors
    if (sanitized.statusCode >= 500) {
      assertEquals(sanitized.message, 'An internal error occurred. Please try again later.');
      assertEquals(sanitized.code, 'INTERNAL_ERROR');
    }
    
    // Should include timestamp and request ID
    assertExists(sanitized.timestamp);
    assertExists(sanitized.statusCode);
  }
});

Deno.test('Error sanitization should preserve client error information', () => {
  const clientErrors = [
    new Error('Invalid email format'),
    new Error('Password must be at least 6 characters'),
    new Error('User not found'),
    new Error('Access denied: insufficient permissions'),
  ];

  for (const error of clientErrors) {
    const sanitized = sanitizeError(error, 400);
    
    // Should preserve the original message for client errors
    assertExists(sanitized.message);
    assertFalse(sanitized.message === 'An internal error occurred. Please try again later.');
    
    // Should have appropriate status code
    assertEquals(sanitized.statusCode, 400);
  }
});

Deno.test('Error sanitization should limit message length', () => {
  const longErrorMessage = 'A'.repeat(300);
  const error = new Error(longErrorMessage);
  
  const sanitized = sanitizeError(error, 400);
  
  // Should truncate long messages
  assertTrue(sanitized.message.length <= 203); // 200 + '...'
  assertTrue(sanitized.message.endsWith('...'));
});

Deno.test('Error sanitization should handle non-Error objects', () => {
  const nonErrors = [
    'string error',
    123,
    { custom: 'error' },
    null,
    undefined,
  ];

  for (const nonError of nonErrors) {
    const sanitized = sanitizeError(nonError, 500);
    
    // Should handle gracefully
    assertExists(sanitized.message);
    assertEquals(sanitized.statusCode, 500);
    assertEquals(sanitized.code, 'UNKNOWN_ERROR');
  }
});

Deno.test('withErrorSanitization should wrap functions properly', async () => {
  let callCount = 0;
  
  const successfulFunction = async () => {
    callCount++;
    return { success: true, data: 'test' };
  };
  
  const wrappedFunction = withErrorSanitization(successfulFunction);
  const result = await wrappedFunction();
  
  assertEquals(result.status, 200);
  assertEquals(callCount, 1);
  
  const responseData = await result.json();
  assertEquals(responseData.success, true);
  assertEquals(responseData.data, 'test');
});

Deno.test('withErrorSanitization should handle errors', async () => {
  const failingFunction = async () => {
    throw new Error('Database connection failed');
  };
  
  const wrappedFunction = withErrorSanitization(failingFunction);
  const result = await wrappedFunction();
  
  assertEquals(result.status, 500);
  
  const errorResponse = await result.json();
  assertEquals(errorResponse.message, 'An internal error occurred. Please try again later.');
  assertEquals(errorResponse.code, 'INTERNAL_ERROR');
});

Deno.test('withErrorSanitization should add request IDs', async () => {
  const testFunction = async () => {
    return { success: true };
  };
  
  const wrappedFunction = withErrorSanitization(testFunction, { includeRequestId: true });
  const result = await wrappedFunction();
  
  const requestId = result.headers.get('X-Request-ID');
  assertExists(requestId);
  assertTrue(requestId.startsWith('req_'));
});

Deno.test('createSanitizedErrorResponse should create proper responses', () => {
  const response = createSanitizedErrorResponse('UNAUTHORIZED', 'Missing token');
  
  assertEquals(response.status, 401);
  assertEquals(response.headers.get('Content-Type'), 'application/json');
  
  const responseData = JSON.parse(response.body?.toString() || '{}');
  assertEquals(responseData.message, 'Missing token');
  assertEquals(responseData.code, 'UNAUTHORIZED');
  assertEquals(responseData.statusCode, 401);
  assertExists(responseData.timestamp);
});

Deno.test('Error types should have correct configurations', () => {
  assertEquals(ErrorTypes.BAD_REQUEST.statusCode, 400);
  assertEquals(ErrorTypes.UNAUTHORIZED.statusCode, 401);
  assertEquals(ErrorTypes.FORBIDDEN.statusCode, 403);
  assertEquals(ErrorTypes.NOT_FOUND.statusCode, 404);
  assertEquals(ErrorTypes.METHOD_NOT_ALLOWED.statusCode, 405);
  assertEquals(ErrorTypes.CONFLICT.statusCode, 409);
  assertEquals(ErrorTypes.RATE_LIMITED.statusCode, 429);
  assertEquals(ErrorTypes.INTERNAL_ERROR.statusCode, 500);
  assertEquals(ErrorTypes.SERVICE_UNAVAILABLE.statusCode, 503);
});

Deno.test('createSanitizedError should create Response objects', () => {
  const error = new Error('Test error');
  const response = createSanitizedError(error, 400, 'test-123');
  
  assertTrue(response instanceof Response);
  assertEquals(response.status, 400);
  assertEquals(response.headers.get('X-Request-ID'), 'test-123');
  assertEquals(response.headers.get('Content-Type'), 'application/json');
});

Deno.test('Error sanitization should filter dangerous patterns', () => {
  const dangerousErrors = [
    new Error('Error in database query: DROP TABLE users'),
    new Error('SQL injection detected: SELECT password FROM admins'),
    new Error('Token validation failed: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'),
    new Error('Internal configuration: API_KEY=sk-1234567890'),
    new Error('Secret exposed: SECRET_KEY=my-secret-value'),
  ];

  for (const error of dangerousErrors) {
    const sanitized = sanitizeError(error, 400);
    
    // Should filter out dangerous patterns
    assertFalse(sanitized.message.toLowerCase().includes('drop table'));
    assertFalse(sanitized.message.toLowerCase().includes('select password'));
    assertFalse(sanitized.message.toLowerCase().includes('api_key'));
    assertFalse(sanitized.message.toLowerCase().includes('secret_key'));
    assertFalse(sanitized.message.toLowerCase().includes('token'));
  }
});
