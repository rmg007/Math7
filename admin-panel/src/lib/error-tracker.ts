import { supabase } from './supabase';

interface ErrorContext {
  url?: string;
  userAgent?: string;
  appVersion?: string;
  appId?: string;
  extra?: Record<string, unknown>;
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

    const { data, error: rpcError } = await supabase.rpc('log_error' as never, {
      p_platform: 'web',
      p_error_type: errorObj.name || 'Error',
      p_error_message: errorObj.message || String(error),
      p_stack_trace: errorObj.stack || null,
      p_url: context?.url || window.location.href,
      p_user_agent: context?.userAgent || navigator.userAgent,
      p_app_version: context?.appVersion || import.meta.env.VITE_APP_VERSION || '1.0.0',
      p_app_id: context?.appId || null,
      p_extra_context: context?.extra || {},
    } as never);

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
 * This is a no-op in our system since we use auth.uid() server-side.
 */
 
export function setUser(_userId: string, _email?: string): void {
  // User context is automatically captured via Supabase auth
  // This function exists for API compatibility
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
