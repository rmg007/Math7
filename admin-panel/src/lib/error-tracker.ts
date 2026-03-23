import { env, isDevMode } from '@/config/env';
import type { Json } from './database.types';
import { supabase } from './supabase';

/**
 * Enhanced Error Context with tracing and performance metrics (F-18).
 */
interface ErrorContext {
  url?: string;
  userAgent?: string;
  appVersion?: string;
  appId?: string;
  componentName?: string;
  componentStack?: string;
  correlationId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

// ─── Constants & State ───────────────────────────────────────────────────────

const MAX_BREADCRUMBS = 50; // Increased for better trace history
const breadcrumbs: Array<{
  timestamp: string;
  message: string;
  category: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  data?: Record<string, unknown>;
}> = [];

// Persistent Session ID for the duration of the page load
const SESSION_ID = crypto.randomUUID();

let currentUser: { id: string; email?: string } | null = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Recursively sanitizes objects to remove potential PII.
 */
export function sanitizeData(obj: Record<string, unknown>): Record<string, unknown> {
  const PII_KEYS = [
    'email',
    'password',
    'token',
    'secret',
    'phone',
    'address',
    'name',
    'full_name',
    'userId',
    'user_id',
    'credit_card',
    'ssn',
    'auth',
  ];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (PII_KEYS.some((pii) => key.toLowerCase().includes(pii))) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeData(value as Record<string, unknown>);
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Sanitizes strings for PII like emails.
 */
export function sanitizeString(str: string): string {
  if (!str) return str;
  // Basic email regex: word chars @ word chars . word chars
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return str.replace(emailRegex, '[EMAIL_REDACTED]');
}

/**
 * Hashes a string using SHA-256 for PII protection.
 */
export async function hashString(str: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 16);
}

/**
 * Gathers rich environment telemetry automatically.
 */
function getTelemetry() {
  const nav = navigator as Navigator & {
    connection?: { effectiveType: string; rtt: number; downlink: number; saveData: boolean };
  };
  const perf = performance as Performance & {
    memory?: { jsHeapSizeLimit: number; usedJSHeapSize: number };
  };
  const conn = nav.connection;

  return {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      orientation: window.screen.orientation?.type,
    },
    performance: {
      memory: perf.memory
        ? {
            limit: Math.round(perf.memory.jsHeapSizeLimit / 1048576),
            used: Math.round(perf.memory.usedJSHeapSize / 1048576),
          }
        : undefined,
      navigationType: performance.getEntriesByType('navigation')[0]?.name,
    },
    network: conn
      ? {
          effectiveType: conn.effectiveType,
          rtt: conn.rtt,
          downlink: conn.downlink,
          saveData: conn.saveData,
        }
      : undefined,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * Adds a structured breadcrumb to the current session context.
 */
export function addBreadcrumb(
  message: string,
  category = 'app',
  level: 'debug' | 'info' | 'warn' | 'error' = 'info',
  data?: Record<string, unknown>
): void {
  const sanitizedData = data ? sanitizeData(data) : undefined;

  breadcrumbs.push({
    timestamp: new Date().toISOString(),
    message,
    category,
    level,
    data: sanitizedData,
  });

  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }
}

/**
 * Captures an exception and logs it to Supabase with full trace data.
 */
export async function captureException(
  error: Error | unknown,
  context?: ErrorContext
): Promise<string | null> {
  try {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const message = errorObj.message || String(error);

    // Filter noisy browser/network errors
    if (
      message.includes('ResizeObserver') ||
      message.includes('signal aborted') ||
      message.includes('user aborted') ||
      message.includes('Script error.') // Cross-origin issues
    ) {
      return null;
    }

    const correlationId = context?.correlationId || crypto.randomUUID();
    const telemetry = getTelemetry();

    const { error: rpcError } = await supabase.rpc('log_error', {
      p_platform: 'web',
      p_error_type: errorObj.name || 'Error',
      p_error_message: sanitizeString(message),
      p_stack_trace: sanitizeString(errorObj.stack || context?.componentStack || ''),
      p_url: context?.url || window.location.href,
      p_user_agent: context?.userAgent || navigator.userAgent,
      p_app_version: context?.appVersion || env.appVersion || '1.0.0',
      p_app_id: context?.appId || undefined,
      p_extra_context: sanitizeData({
        ...context?.extra,
        session_id: SESSION_ID,
        correlation_id: correlationId,
        component_name: context?.componentName,
        telemetry,
        breadcrumbs: [...breadcrumbs],
        tags: context?.tags,
        user: currentUser ? { id: currentUser.id } : null, // Only log UID, not email
      }) as Json,
    });

    if (rpcError) {
      console.error('[ErrorTracker] RPC Failed:', rpcError);
      return null;
    }

    if (isDevMode()) {
      console.log(`[ErrorTracker] 🚩 Logged ${correlationId}`, { message, telemetry });
    }

    return correlationId;
  } catch (e) {
    console.error('[ErrorTracker] Critical Failure:', e);
    return null;
  }
}

/**
 * Captures a message with a specific severity level.
 */
export async function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: ErrorContext
): Promise<string | null> {
  addBreadcrumb(message, 'manual', level === 'warning' ? 'warn' : level);
  return captureException(new Error(message), {
    ...context,
    tags: { level, ...context?.tags },
  });
}

/**
 * Sets user context for all future logs in this session.
 */
export function setUser(id: string, email?: string): void {
  currentUser = { id, email };
  addBreadcrumb(`User identified: ${id}`, 'auth', 'info');
}

/**
 * Initializes global listeners for uncaught errors and rejections.
 */
export function initErrorTracking(): void {
  // Promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    captureException(event.reason, {
      extra: { type: 'unhandledrejection', promise: true },
      tags: { severity: 'critical' },
    });
  });

  // Runtime errors
  window.addEventListener('error', (event) => {
    // Skip if handled by React Error Boundary (which calls captureException directly)
    if (event.error?.handledByBoundary) return;

    captureException(event.error || event.message, {
      extra: {
        type: 'uncaught',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
      tags: { severity: 'critical' },
    });
  });

  // Track page visibility changes as breadcrumbs
  document.addEventListener('visibilitychange', () => {
    addBreadcrumb(`Visibility changed: ${document.visibilityState}`, 'system', 'debug');
  });

  if (isDevMode()) {
    console.log(`[ErrorTracker] Tracking Active | Session: ${SESSION_ID}`);
  }
}
