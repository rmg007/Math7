import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AuthConfirmPage — Safe relay page for Supabase auth email links.
 *
 * WHY this page exists:
 * Microsoft Defender Safe Links (and similar corporate email scanners)
 * pre-fetch every link in an email to scan for malware. When they hit a
 * Supabase password-reset/magic-link URL directly, the OTP is consumed
 * and the user gets "link expired" errors before they ever click anything.
 *
 * HOW it works:
 * Our email template links to:
 *   https://admin.questerix.com/auth/confirm#token_hash=XXX&type=recovery
 *
 * The "#" (hash fragment) is NEVER sent to any server — it is client-side only.
 * Safe Links scans https://admin.questerix.com/auth/confirm (just an HTML page)
 * and cannot see anything after the "#". The OTP survives until the user clicks.
 *
 * Token formats handled (in priority order):
 * 1. Hash fragment:  #token_hash=...&type=... (our email template — Safe Links safe)
 * 2. URL params:     ?token_hash=...&type=...  (Supabase PKCE redirect)
 * 3. Hash fragment:  #access_token=...&type=...  (Supabase legacy implicit flow)
 */
export function AuthConfirmPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authType, setAuthType] = useState<string | null>(null);
  const [tokenHash, setTokenHash] = useState<string | null>(null);

  // Detect what kind of link this is from URL params/fragment — but do NOT
  // consume the token yet. The scanner sees just detection, not exchange.
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));

    // Check for errors first (e.g. already-expired links landing via Supabase redirect)
    const errorCode = hashParams.get('error_code') ?? searchParams.get('error_code');
    const errorDesc = hashParams.get('error_description') ?? searchParams.get('error_description');
    if (errorCode) {
      setStatus('error');
      setErrorMessage(
        errorDesc
          ? decodeURIComponent(errorDesc.replace(/\+/g, ' '))
          : 'This link has expired or is invalid. Please request a new one.'
      );
      return;
    }

    // Priority 1: Hash fragment with token_hash — our email template's Safe Links bypass.
    // Format: #token_hash=xxx&type=recovery
    // Hash fragments are client-side only, never sent to servers — scanner can't see them.
    const tokenHashInFragment = hashParams.get('token_hash');
    const typeInFragment = hashParams.get('type');

    // Priority 2: PKCE flow — Supabase puts token_hash in URL params after redirect
    const tokenHashInParams = searchParams.get('token_hash');
    const typeInParams = searchParams.get('type');

    // Priority 3: Legacy implicit flow — access_token in URL fragment
    const accessToken = hashParams.get('access_token');
    const typeInHashLegacy = hashParams.get('type');

    if (tokenHashInFragment && typeInFragment) {
      // Our email template's safe format: #token_hash=...&type=...
      setTokenHash(tokenHashInFragment);
      setAuthType(typeInFragment);
    } else if (tokenHashInParams && typeInParams) {
      // Supabase PKCE redirect after verify: ?token_hash=...&type=...
      setTokenHash(tokenHashInParams);
      setAuthType(typeInParams);
    } else if (accessToken && typeInHashLegacy) {
      // Legacy implicit flow — Supabase JS SDK detects the hash automatically
      setAuthType(typeInHashLegacy);
    } else {
      // No token at all — redirect to login
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleConfirm = async () => {
    if (authType === 'recovery') {
      // Validate passwords match before touching the token
      if (newPassword.length < 8) {
        setErrorMessage('Password must be at least 8 characters');
        setStatus('error');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('Passwords do not match');
        setStatus('error');
        return;
      }
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      if (authType === 'recovery') {
        // Step 1: Verify the OTP to establish a session
        if (tokenHash) {
          // PKCE flow
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          if (verifyError) throw verifyError;
        }
        // For legacy flow, Supabase SDK detects the hash automatically.
        // We just call updateUser directly — the SDK handles the session.

        // Step 2: Set the new password
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (updateError) throw updateError;

        setStatus('success');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      } else if (authType === 'signup' || authType === 'magiclink' || authType === 'email_change') {
        // For email confirmations, magic links, and email changes — verifying the OTP creates the session.
        // We MUST have a tokenHash here; without it we cannot safely verify anything.
        if (!tokenHash) {
          throw new Error('No verification token found. Please use the link from your email.');
        }
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: authType as 'signup' | 'magiclink' | 'email_change',
        });
        if (error) throw error;
        setStatus('success');
        setTimeout(() => navigate('/', { replace: true }), 1500);
      } else {
        setStatus('error');
        setErrorMessage('Unknown auth type. Please request a new link.');
      }
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again or request a new link.'
      );
    }
  };

  const isRecovery = authType === 'recovery';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isLoading = status === 'loading';

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4 shadow-sm">
            {isSuccess ? (
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            ) : isError ? (
              <AlertCircle className="w-7 h-7 text-destructive" />
            ) : isRecovery ? (
              <Lock className="w-7 h-7 text-primary" />
            ) : (
              <KeyRound className="w-7 h-7 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {isSuccess
              ? 'All Done!'
              : isError && status === 'error' && !authType
                ? 'Link Expired'
                : isRecovery
                  ? 'Set New Password'
                  : 'Confirm Your Account'}
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {isSuccess
              ? isRecovery
                ? 'Password updated successfully. Redirecting to sign in…'
                : 'Verified! Redirecting…'
              : isError
                ? ''
                : isRecovery
                  ? 'Choose a strong new password for your account.'
                  : 'Click the button below to confirm and sign in.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-8">
          {/* Error state */}
          {isError && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-destructive/10 text-destructive text-sm p-4 rounded-xl">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{errorMessage || 'This link has expired or is invalid.'}</span>
              </div>
              {/* Show password form again if user typed bad passwords */}
              {isRecovery && authType && (
                <button
                  onClick={() => setStatus('idle')}
                  className="w-full mt-2 py-2 px-4 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                >
                  ← Try again
                </button>
              )}
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all hover:shadow-md active:scale-95 text-sm"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {/* Success state */}
          {isSuccess && (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                You'll be redirected in a moment…
              </p>
            </div>
          )}

          {/* Idle / action state */}
          {!isError && !isSuccess && (
            <div className="space-y-5">
              {isRecovery && (
                <>
                  <div className="space-y-2">
                    <label
                      htmlFor="new-password"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      New Password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Min 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="confirm-password"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                      disabled={isLoading}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition disabled:opacity-50"
                    />
                  </div>
                </>
              )}

              <button
                id="auth-confirm-btn"
                onClick={handleConfirm}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all hover:shadow-md active:scale-95 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? 'Verifying…' : isRecovery ? 'Set New Password' : 'Confirm & Sign In'}
              </button>

              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                ← Back to Sign In
              </button>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-zinc-400 mt-6">
          Questerix Admin · Secure Authentication
        </p>
      </div>
    </div>
  );
}
