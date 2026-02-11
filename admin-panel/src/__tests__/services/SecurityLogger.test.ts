import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityLogger, SecurityEventSeverity } from '@/services/SecurityLogger';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

// Mock import.meta.env.DEV
const originalDev = import.meta.env.DEV;

describe('SecurityLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('DEV', 'false');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('log', () => {
    it('should call log_security_event RPC with correct parameters', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      });

      const eventData = {
        eventType: 'test_event',
        severity: 'medium' as SecurityEventSeverity,
        metadata: { userId: '123', action: 'test' },
        appId: 'test-app',
      };

      await SecurityLogger.log(eventData);

      expect(supabase.rpc).toHaveBeenCalledWith('log_security_event', {
        p_event_type: 'test_event',
        p_severity: 'medium',
        p_metadata: { userId: '123', action: 'test' },
        p_app_id: 'test-app',
        p_location: undefined,
      });
    });

    it('should handle missing metadata gracefully', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      });

      const eventData = {
        eventType: 'test_event',
        severity: 'low' as SecurityEventSeverity,
      };

      await SecurityLogger.log(eventData);

      expect(supabase.rpc).toHaveBeenCalledWith('log_security_event', {
        p_event_type: 'test_event',
        p_severity: 'low',
        p_metadata: {},
        p_app_id: undefined,
        p_location: undefined,
      });
    });

    it('should handle RPC errors silently in production', async () => {
      vi.stubEnv('DEV', 'false');
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const eventData = {
        eventType: 'test_event',
        severity: 'high' as SecurityEventSeverity,
      };

      await SecurityLogger.log(eventData);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log RPC errors to console in development', async () => {
      vi.stubEnv('DEV', 'true');
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const eventData = {
        eventType: 'test_event',
        severity: 'high' as SecurityEventSeverity,
      };

      await SecurityLogger.log(eventData);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SecurityLogger] Failed to log event:',
        { message: 'Database error' }
      );
      consoleSpy.mockRestore();
    });

    it('should log success to console in development', async () => {
      vi.stubEnv('DEV', 'true');
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const eventData = {
        eventType: 'test_event',
        severity: 'info' as SecurityEventSeverity,
      };

      await SecurityLogger.log(eventData);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SecurityLogger] Event logged:',
        'test_event'
      );
      consoleSpy.mockRestore();
    });

    it('should handle network errors gracefully', async () => {
      vi.mocked(supabase.rpc).mockRejectedValue(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const eventData = {
        eventType: 'test_event',
        severity: 'critical' as SecurityEventSeverity,
      };

      await SecurityLogger.log(eventData);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SecurityLogger] Unexpected error:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('should not throw errors under any circumstances', async () => {
      vi.mocked(supabase.rpc).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const eventData = {
        eventType: 'test_event',
        severity: 'medium' as SecurityEventSeverity,
      };

      // Should not throw
      await expect(SecurityLogger.log(eventData)).resolves.toBeUndefined();
    });
  });

  describe('logLogin', () => {
    it('should log login event with correct parameters', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      });

      await SecurityLogger.logLogin('user-123');

      expect(supabase.rpc).toHaveBeenCalledWith('log_security_event', {
        p_event_type: 'login',
        p_severity: 'info',
        p_metadata: { userId: 'user-123' },
        p_app_id: undefined,
        p_location: undefined,
      });
    });
  });

  describe('logLogout', () => {
    it('should log logout event with correct parameters', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      });

      await SecurityLogger.logLogout();

      expect(supabase.rpc).toHaveBeenCalledWith('log_security_event', {
        p_event_type: 'logout',
        p_severity: 'info',
        p_metadata: {},
        p_app_id: undefined,
        p_location: undefined,
      });
    });
  });

  describe('logSensitiveAction', () => {
    it('should log sensitive action with correct parameters', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      });

      await SecurityLogger.logSensitiveAction('delete_user', {
        targetUserId: 'user-456',
        reason: 'spam',
      });

      expect(supabase.rpc).toHaveBeenCalledWith('log_security_event', {
        p_event_type: 'sensitive_action',
        p_severity: 'medium',
        p_metadata: {
          action: 'delete_user',
          targetUserId: 'user-456',
          reason: 'spam',
        },
        p_app_id: undefined,
        p_location: undefined,
      });
    });

    it('should handle sensitive action without metadata', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      });

      await SecurityLogger.logSensitiveAction('export_data');

      expect(supabase.rpc).toHaveBeenCalledWith('log_security_event', {
        p_event_type: 'sensitive_action',
        p_severity: 'medium',
        p_metadata: { action: 'export_data' },
        p_app_id: undefined,
        p_location: undefined,
      });
    });
  });

  describe('severity levels', () => {
    it('should handle all severity levels correctly', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      });

      const severities: SecurityEventSeverity[] = [
        'info',
        'low',
        'medium',
        'high',
        'critical',
      ];

      for (const severity of severities) {
        await SecurityLogger.log({
          eventType: 'test_event',
          severity,
        });

        expect(supabase.rpc).toHaveBeenCalledWith('log_security_event', {
          p_event_type: 'test_event',
          p_severity: severity,
          p_metadata: {},
          p_app_id: undefined,
          p_location: undefined,
        });
      }
    });
  });
});
