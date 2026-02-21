import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { SecurityLogger } from '@/services/SecurityLogger';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Rocket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  inviteCode: z.string().min(1, 'Invitation code is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Manage the "Remember Me" preference via localStorage.
  // When unchecked, we set a sessionStorage flag. On the *next* page load
  // (new tab or after browser restart), sessionStorage is empty so the
  // auth-guard can detect "no persist" and call signOut. This avoids the
  // unreliable pattern of calling async signOut() in beforeunload.
  // Manage the "Remember Me" preference via localStorage.
  // When unchecked, we set a sessionStorage flag. On the *next* page load
  // (new tab or after browser restart), sessionStorage is empty so the
  // auth-guard can detect "no persist" and call signOut. This avoids the
  // unreliable pattern of calling async signOut() in beforeunload.
  useEffect(() => {
    if (rememberMe) {
      // Mark that this session should persist
      localStorage.setItem('questerix_remember_me', '1');
      sessionStorage.setItem('questerix_session_active', '1');
    } else {
      // Mark that session should NOT persist across tab close
      localStorage.removeItem('questerix_remember_me');
      sessionStorage.setItem('questerix_session_active', '1');
    }
  }, [rememberMe]);

  // If user visits /login but is already authenticated, redirect to dashboard
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkSession();
  }, [navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onLogin = async (data: LoginFormValues) => {
    setError(null);
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError(error.message);
      SecurityLogger.log({
        eventType: 'failed_login',
        severity: 'low',
        metadata: { email: data.email, reason: error.message },
      }).catch((err) => {
        console.error('Failed to log security event:', err);
      });
    } else {
      await SecurityLogger.logLogin(authData.user.id);

      navigate('/');
    }
  };

  const onForgotPassword = async () => {
    if (!resetEmail.trim()) {
      setError('Please enter your email address');
      return;
    }
    setError(null);
    setIsResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      // Always redirect to the production admin panel's /auth/confirm page.
      // Using window.location.origin here would send localhost links in development,
      // which create broken/expired links. The /auth/confirm page is the safe relay
      // that defeats Microsoft Defender Safe Links pre-fetching.
      redirectTo: 'https://admin.questerix.com/auth/confirm',
    });
    setIsResetting(false);
    if (error) {
      setError(error.message);
    } else {
      setResetEmailSent(true);
    }
  };

  const onRegister = async (data: RegisterFormValues) => {
    setError(null);

    // Step 1: Pre-validate invitation code (fast UX feedback, non-consuming)
    const { data: isValid, error: validateError } = await supabase.rpc('validate_invitation_code', {
      p_code: data.inviteCode,
    });

    if (validateError || !isValid) {
      setError('Invalid or expired invitation code');
      SecurityLogger.log({
        eventType: 'failed_register_invite',
        severity: 'medium',
        metadata: { email: data.email, inviteCode: data.inviteCode.slice(-4) },
      }).catch((err) => {
        console.error('Failed to log security event:', err);
      });
      return;
    }

    // Step 2: Create user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: undefined,
        data: {
          full_name: data.fullName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      SecurityLogger.log({
        eventType: 'failed_register',
        severity: 'low',
        metadata: { email: data.email, reason: signUpError.message },
      }).catch((err) => {
        console.error('Failed to log security event:', err);
      });
      return;
    }

    if (signUpData.user) {
      await SecurityLogger.log({
        eventType: 'register',
        severity: 'info',
        metadata: {
          email: data.email,
          inviteCode: data.inviteCode.slice(-4),
          userId: signUpData.user.id,
        },
      }).catch((err) => {
        console.error('Failed to log security event:', err);
      });
    }

    // Step 3: Atomically validate AND consume invitation code (closes race window)
    const rpcName = 'validate_and_use_invitation_code' as unknown as 'validate_invitation_code';
    const { data: consumeResult, error: consumeError } = await supabase.rpc(rpcName, {
      p_code: data.inviteCode,
    });

    if (consumeError || !consumeResult) {
      setError('Failed to use invitation code. Please contact support.');
      SecurityLogger.log({
        eventType: 'failed_register_consume',
        severity: 'medium',
        metadata: { email: data.email, inviteCode: data.inviteCode.slice(-4) },
      }).catch((err) => {
        console.error('Failed to log security event:', err);
      });
      return;
    }

    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 overflow-x-hidden">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Rocket className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Questerix Admin</h1>
          <p className="text-muted-foreground mt-2">Curriculum Management System</p>
        </div>

        <Card className="border-border/40 shadow-none sm:shadow-xl overflow-hidden">
          <CardHeader>
            <CardTitle>
              {isForgotPassword ? 'Reset Password' : isRegister ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {isForgotPassword
                ? "Enter your email and we'll send you a reset link"
                : isRegister
                  ? 'Enter your details to get started'
                  : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isForgotPassword ? (
              <div className="space-y-4">
                {resetEmailSent ? (
                  <div className="text-center space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Check your email for a password reset link. If you don&apos;t see it, check
                      your spam folder.
                    </p>
                    <Button
                      variant="link"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setResetEmailSent(false);
                        setResetEmail('');
                        setError(null);
                      }}
                      className="text-muted-foreground"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back to Sign In
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="name@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onForgotPassword()}
                      />
                    </div>
                    {error && (
                      <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    )}
                    <Button className="w-full" onClick={onForgotPassword} disabled={isResetting}>
                      {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Reset Link
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setError(null);
                      }}
                      className="w-full text-muted-foreground"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back to Sign In
                    </Button>
                  </>
                )}
              </div>
            ) : isRegister ? (
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    {...registerForm.register('fullName')}
                  />
                  {registerForm.formState.errors.fullName && (
                    <p className="text-sm text-destructive">
                      {registerForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    {...registerForm.register('email')}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showRegisterPassword ? 'text' : 'password'}
                      {...registerForm.register('password')}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">
                        {showRegisterPassword ? 'Hide password' : 'Show password'}
                      </span>
                    </Button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Invitation Code</Label>
                  <Input
                    id="inviteCode"
                    placeholder="INV-..."
                    {...registerForm.register('inviteCode')}
                  />
                  {registerForm.formState.errors.inviteCode && (
                    <p className="text-sm text-destructive">
                      {registerForm.formState.errors.inviteCode.message}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <Button
                  className="w-full"
                  type="submit"
                  disabled={registerForm.formState.isSubmitting}
                >
                  {registerForm.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Account
                </Button>
              </form>
            ) : (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="name@example.com"
                    {...loginForm.register('email')}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      {...loginForm.register('password')}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">
                        {showPassword ? 'Hide password' : 'Show password'}
                      </span>
                    </Button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    <Label
                      htmlFor="remember-me"
                      className="text-sm font-normal text-muted-foreground cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-muted-foreground px-0 h-auto"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError(null);
                    }}
                  >
                    Forgot password?
                  </Button>
                </div>

                <Button
                  className="w-full"
                  type="submit"
                  disabled={loginForm.formState.isSubmitting}
                >
                  {loginForm.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign In
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            {!isForgotPassword && (
              <Button
                variant="link"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-muted-foreground"
              >
                {isRegister
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Register"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
