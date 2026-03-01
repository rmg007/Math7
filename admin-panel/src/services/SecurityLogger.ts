import { isDevMode } from '@/config/env';
import { supabase } from '@/lib/supabase';
import type { Json } from '@/lib/database.types';

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
      const { error } = await supabase.rpc('log_security_event', {
        p_event_type: data.eventType,
        p_severity: data.severity,
        p_metadata: (data.metadata || {}) as Json,
        p_app_id: data.appId || undefined,
        p_location: undefined,
      });

      if (error) {
        if (isDevMode()) {
          console.error('[SecurityLogger] Failed to log event:', error);
        }
      } else {
        if (isDevMode()) {
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
      metadata: { userId },
    });
  }

  async logLogout() {
    return this.log({
      eventType: 'logout',
      severity: 'info',
    });
  }

  async logSensitiveAction(action: string, metadata?: Record<string, unknown>) {
    return this.log({
      eventType: 'sensitive_action',
      severity: 'medium',
      metadata: { action, ...metadata },
    });
  }
}

export const SecurityLogger = new SecurityLoggerService();
