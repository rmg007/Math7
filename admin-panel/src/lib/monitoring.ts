// Placeholder monitoring module for error tracking
// This is a stub implementation that can be replaced with a real monitoring service later

export interface MonitoringEvent {
  type: 'error' | 'warning' | 'info';
  message: string;
  context?: Record<string, unknown>;
}

export function logEvent(event: MonitoringEvent): void {
  if (import.meta.env.DEV) {
    console.log('[Monitoring]', event.type, event.message, event.context);
  }
}

export function logError(error: Error, context?: Record<string, unknown>): void {
  console.error('[Monitoring Error]', error.message, context);
  logEvent({
    type: 'error',
    message: error.message,
    context: { ...context, stack: error.stack },
  });
}

export function captureException(error: Error, context?: Record<string, unknown>): void {
  logError(error, context);
}

export function setUser(userId: string, email?: string): void {
  if (import.meta.env.DEV) {
    console.log('[Monitoring] User set:', userId, email);
  }
  logEvent({
    type: 'info',
    message: `User set: ${userId} (${email})`,
    context: { userId, email }
  });
}
