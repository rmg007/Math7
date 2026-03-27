import { isDevMode } from '@/config/env';
import { supabase } from '@/lib/supabase';
import type { Json } from '@questerix/core/types/database';
import { hashString, sanitizeData } from '@/lib/error-tracker';

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
      const sanitizedMetadata = data.metadata ? sanitizeData(data.metadata) : {};

      const { error } = await supabase.rpc('log_security_event', {
        p_event_type: data.eventType,
        p_severity: data.severity,
        p_metadata: sanitizedMetadata as Json,
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
      if (isDevMode()) {
        console.error('[SecurityLogger] Unexpected error:', err);
      }
    }
  }

  async logLogin(userId: string) {
    const userIdHash = await hashString(userId);
    return this.log({
      eventType: 'login',
      severity: 'info',
      metadata: { userId_hash: userIdHash },
    });
  }

  async logLogout() {
    return this.log({
      eventType: 'logout',
      severity: 'info',
    });
  }

  async logSensitiveAction(action: string, metadata?: Record<string, unknown>) {
    // Proactively hash any email in metadata if present
    const processedMetadata: Record<string, unknown> = { action, ...metadata };

    if (processedMetadata.email && typeof processedMetadata.email === 'string') {
      processedMetadata.email_hash = await hashString(processedMetadata.email);
      delete processedMetadata.email;
    }

    if (processedMetadata.userId && typeof processedMetadata.userId === 'string') {
      processedMetadata.userId_hash = await hashString(processedMetadata.userId);
      delete processedMetadata.userId;
    }

    if (processedMetadata.user_id && typeof processedMetadata.user_id === 'string') {
      processedMetadata.userId_hash = await hashString(processedMetadata.user_id);
      delete processedMetadata.user_id;
    }

    return this.log({
      eventType: 'sensitive_action',
      severity: 'medium',
      metadata: processedMetadata,
    });
  }
}

export const SecurityLogger = new SecurityLoggerService();
