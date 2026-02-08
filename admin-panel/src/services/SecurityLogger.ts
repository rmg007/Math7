import { supabase } from '@/lib/supabase';

export type SecurityEventSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEventData {
  eventType: string;
  severity: SecurityEventSeverity;
  metadata?: Record<string, unknown>;
  appId?: string;
}

class SecurityLoggerService {
  /**
   * Logs a security event to the server-side audit log.
   * Fails silently in production to avoid blocking user actions, but logs to console in dev.
   */
  async log(data: SecurityEventData): Promise<void> {
    try {
      // @ts-expect-error - RPC call types are dynamic
      const { error } = await supabase.rpc('log_security_event', {
        p_event_type: data.eventType,
        p_severity: data.severity,
        p_metadata: data.metadata || {},
        p_app_id: data.appId || null,
        // Location is optional and often handled by the edge function/RPC via headers
        p_location: null 
      } as unknown as { error: unknown }); // RPC type casting workaround

      if (error) {
        if (import.meta.env.DEV) {
          console.error('[SecurityLogger] Failed to log event:', error);
        }
      } else {
        if (import.meta.env.DEV) {
          console.log('[SecurityLogger] Event logged:', data.eventType);
        }
      }
    } catch (err) {
      // Catch-all to prevent app crashes due to logging failures
      console.error('[SecurityLogger] Unexpected error:', err);
    }
  }

  async logLogin(userId: string) {
    return this.log({
      eventType: 'login',
      severity: 'info',
      metadata: { userId }
    });
  }

  async logLogout() {
    return this.log({
      eventType: 'logout',
      severity: 'info'
    });
  }

  async logSensitiveAction(action: string, metadata?: Record<string, unknown>) {
    return this.log({
      eventType: 'sensitive_action',
      severity: 'medium',
      metadata: { action, ...metadata }
    });
  }
}

export const SecurityLogger = new SecurityLoggerService();
