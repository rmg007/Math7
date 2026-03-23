import { supabase } from '@/lib/supabase';
import { SecurityLogger } from '@/services/SecurityLogger';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe('SecurityLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('DEV', true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('log', () => {
    it('should call log_security_event RPC with correct parameters', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as Awaited<
        ReturnType<typeof supabase.rpc>
      >);

      await SecurityLogger.log({
        eventType: 'test_event',
        severity: 'info',
        metadata: { key: 'value' },
        appId: 'app-123',
      });

      expect(supabase.rpc).toHaveBeenCalledWith('log_security_event', {
        p_event_type: 'test_event',
        p_severity: 'info',
        p_metadata: { key: 'value' },
        p_app_id: 'app-123',
        p_location: undefined,
      });
    });

    it('should handle optional fields', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as Awaited<
        ReturnType<typeof supabase.rpc>
      >);

      await SecurityLogger.log({
        eventType: 'minimal_event',
        severity: 'low',
      });

      expect(supabase.rpc).toHaveBeenCalledWith('log_security_event', {
        p_event_type: 'minimal_event',
        p_severity: 'low',
        p_metadata: {},
        p_app_id: undefined,
        p_location: undefined,
      });
    });

    it('should log to console in development on success', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as Awaited<
        ReturnType<typeof supabase.rpc>
      >);

      await SecurityLogger.log({ eventType: 'dev_event', severity: 'info' });

      expect(consoleSpy).toHaveBeenCalledWith('[SecurityLogger] Event logged:', 'dev_event');
    });

    it('should log to console.error in development on failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = { message: 'RPC Error' };
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: mockError } as Awaited<
        ReturnType<typeof supabase.rpc>
      >);

      await SecurityLogger.log({ eventType: 'fail_event', severity: 'high' });

      expect(consoleSpy).toHaveBeenCalledWith('[SecurityLogger] Failed to log event:', mockError);
    });

    it('should handle unexpected errors without throwing', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(supabase.rpc).mockRejectedValue(new Error('Network failure'));

      // Should not throw
      await expect(
        SecurityLogger.log({ eventType: 'error_event', severity: 'critical' })
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SecurityLogger] Unexpected error:',
        expect.any(Error)
      );
    });
  });

  describe('Convenience Methods', () => {
    beforeEach(() => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as Awaited<
        ReturnType<typeof supabase.rpc>
      >);
    });

    it('should log login', async () => {
      await SecurityLogger.logLogin('user-123');
      expect(supabase.rpc).toHaveBeenCalledWith(
        'log_security_event',
        expect.objectContaining({
          p_event_type: 'login',
          p_metadata: { userId_hash: 'fcdec6df4d44dbc6' },
        })
      );
    });

    it('should log logout', async () => {
      await SecurityLogger.logLogout();
      expect(supabase.rpc).toHaveBeenCalledWith(
        'log_security_event',
        expect.objectContaining({
          p_event_type: 'logout',
        })
      );
    });

    it('should log sensitive action', async () => {
      await SecurityLogger.logSensitiveAction('delete_record', { id: 'rec-1' });
      expect(supabase.rpc).toHaveBeenCalledWith(
        'log_security_event',
        expect.objectContaining({
          p_event_type: 'sensitive_action',
          p_metadata: { action: 'delete_record', id: 'rec-1' },
        })
      );
    });

    it('should hash PII in sensitive action metadata', async () => {
      await SecurityLogger.logSensitiveAction('update_user', {
        email: 'test@example.com',
        userId: 'user-123',
      });
      expect(supabase.rpc).toHaveBeenCalledWith(
        'log_security_event',
        expect.objectContaining({
          p_event_type: 'sensitive_action',
          p_metadata: expect.objectContaining({
            action: 'update_user',
            email_hash: expect.any(String),
            userId_hash: 'fcdec6df4d44dbc6',
          }),
        })
      );

      // Ensure raw PII is NOT in metadata
      const calls = vi.mocked(supabase.rpc).mock.calls;
      const lastCall = calls[calls.length - 1];
      const metadata = (lastCall?.[1] as any)?.p_metadata;
      expect(metadata.email).toBeUndefined();
      expect(metadata.userId).toBeUndefined();
    });
  });
});
