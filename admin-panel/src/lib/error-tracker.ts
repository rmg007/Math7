import type { Json } from './database.types';
import { supabase } from './supabase';

interface ErrorContext {
  url?: string;
  userAgent?: string;
  appVersion?: string;
  appId?: string;
  extra?: Record<string, unknown>;
}

const MAX_BREADCRUMBS = 20;
const breadcrumbs: Array<{
  timestamp: string;
  message: string;
  category?: string;
  data?: Record<string, unknown>;
}> = [];

/**
 * Recursively sanitizes objects to remove potential PII (F-18).
 */
function sanitizeData(obj: Record<string, unknown>): Record<string, unknown> {
  const PII_KEYS = [
    'email',
    'password',
    'token',
    'secret',
    'phone',
    'address',
    'name',
    'credit_card',
  ];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (PII_KEYS.some((pii) => key.toLowerCase().includes(pii))) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Adds a breadcrumb to the current session context.
 * Useful for tracking user actions leading up to an error.
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  data?: Record<string, unknown>
): void {
  // Sanitize data before storing to prevent PII leakage in logs
  const sanitizedData = data ? sanitizeData(data) : undefined;

  breadcrumbs.push({
    timestamp: new Date().toISOString(),
    message,
    category,
    data: sanitizedData,
  });

  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }
}

/**
 * Captures an exception and logs it to Supabase.
 * Zero-cost alternative to Sentry.
 */
export async function captureException(
  error: Error | unknown,
  context?: ErrorContext
): Promise<string | null> {
  try {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const message = errorObj.message || String(error);

    // Filter out noisy/harmless browser errors (P1 Roadmap task)
    if (
      message.includes('ResizeObserver loop completed') ||
      message.includes('ResizeObserver loop limit exceeded') ||
      message.includes('signal aborted') ||
      message.includes('user aborted a request')
    ) {
      if (import.meta.env.DEV) {
        console.debug('[ErrorTracker] Filtered noisy error:', message);
      }
      return null;
    }

    const { data, error: rpcError } = await supabase.rpc('log_error', {
      p_platform: 'web',
      p_error_type: errorObj.name || 'Error',
      p_error_message: message,
      p_stack_trace: errorObj.stack || undefined,
      p_url: context?.url || window.location.href,
      p_user_agent: context?.userAgent || navigator.userAgent,
      p_app_version: context?.appVersion || import.meta.env.VITE_APP_VERSION || '1.0.0',
      p_app_id: context?.appId || undefined,
      p_extra_context: {
        ...context?.extra,
        breadcrumbs: [...breadcrumbs],
      } as Json,
    });

    if (rpcError) {
      console.error('[ErrorTracker] Failed to log error:', rpcError);
      return null;
    }

    if (import.meta.env.DEV) {
      console.log('[ErrorTracker] Error logged:', data);
    }

    return data as string;
  } catch (e) {
    // Fail silently to avoid infinite loops
    console.error('[ErrorTracker] Unexpected failure:', e);
    return null;
  }
}

/**
 * Captures a message (non-error event) to the error log.
 */
export async function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: ErrorContext
): Promise<string | null> {
  return captureException(new Error(message), {
    ...context,
    extra: { ...context?.extra, level },
  });
}

/**
 * Sets user context for future error reports.
 */
export function setUser(_userId: string, _email?: string): void {
  // User context is automatically captured via Supabase auth
}

/**
 * Global error handler for uncaught exceptions.
 */
export function initErrorTracking(): void {
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    captureException(event.reason, {
      extra: { type: 'unhandledrejection' },
    });
  });

  // Capture uncaught errors
  window.addEventListener('error', (event) => {
    captureException(event.error || event.message, {
      extra: {
        type: 'uncaught',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  if (import.meta.env.DEV) {
    console.log('[ErrorTracker] Initialized (Supabase-native)');
  }
}
