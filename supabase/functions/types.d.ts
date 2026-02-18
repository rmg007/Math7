// Deno type declarations for TypeScript IDE support
// This file helps IDE understand Deno-specific APIs and test structure

declare namespace Deno {
  export function test(name: string, fn: () => void | Promise<void>): void;
  export namespace env {
    export function get(key: string): string | undefined;
  }
}

declare module 'https://deno.land/std@0.168.0/testing/asserts.ts' {
  export function assertEquals(actual: unknown, expected: unknown, msg?: string): void;
  export function assertExists(actual: unknown, msg?: string): void;
  export function assertFalse(actual: unknown, msg?: string): void;
  export function assertTrue(actual: unknown, msg?: string): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export function createClient(url: string, key: string, options?: any): any;
}

// Relative module declarations for test files
declare module '../index.ts' {
  export const generateQuestionsHandler: (req: Request, deps?: any) => Promise<Response>;
}

declare module '../input-sanitizer.ts' {
  export function validateGenerationRequest(request: any): any;
  export function sanitizeCustomInstructions(input: string): any;
  export function sanitizeSourceText(input: string): any;
  export function validateDifficultyDistribution(distribution: any): any;
}

declare module '../rate-limiter.ts' {
  export const rateLimitConfigs: any;
  export function createRateLimitMiddleware(config: any): any;
  export function addRateLimitHeaders(response: Response, result: any): Response;
}

declare module '../error-sanitizer.ts' {
  export function createSanitizedError(error: unknown, statusCode?: number, requestId?: string): Response;
  export function sanitizeError(error: unknown, statusCode?: number, requestId?: string): any;
  export function withErrorSanitization<T extends any[], R>(fn: (...args: T) => Promise<R>, options?: any): (...args: T) => Promise<Response>;
  export function createSanitizedErrorResponse(type: string, message?: string, requestId?: string): Response;
  export const ErrorTypes: any;
}

// Module declarations for specific test file locations
declare module '../../_shared/rate-limiter.ts' {
  export const rateLimitConfigs: any;
  export function createRateLimitMiddleware(config: any): any;
  export function addRateLimitHeaders(response: Response, result: any): Response;
}

declare module './rate-limiter.ts' {
  export const rateLimitConfigs: any;
  export function createRateLimitMiddleware(config: any): any;
  export function addRateLimitHeaders(response: Response, result: any): Response;
}

declare module './input-sanitizer.ts' {
  export function validateGenerationRequest(request: any): any;
  export function sanitizeCustomInstructions(input: string): any;
  export function sanitizeSourceText(input: string): any;
  export function validateDifficultyDistribution(distribution: any): any;
}

declare module './error-sanitizer.ts' {
  export function createSanitizedError(error: unknown, statusCode?: number, requestId?: string): Response;
  export function sanitizeError(error: unknown, statusCode?: number, requestId?: string): any;
  export function withErrorSanitization<T extends any[], R>(fn: (...args: T) => Promise<R>, options?: any): (...args: T) => Promise<Response>;
  export function createSanitizedErrorResponse(type: string, message?: string, requestId?: string): Response;
  export const ErrorTypes: any;
}

// Type declarations for test files
declare global {
  // Allow Response in test context
  var Response: typeof globalThis.Response;
}

export { }; // Make this a module

