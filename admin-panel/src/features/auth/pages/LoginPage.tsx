import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Rocket, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { SecurityLogger } from "@/services/SecurityLogger"
import { setUser } from "@/lib/monitoring"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  inviteCode: z.string().min(1, "Invitation code is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>
type RegisterFormValues = z.infer<typeof registerSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const onLogin = async (data: LoginFormValues) => {
    setError(null)
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setError(error.message)
      SecurityLogger.log({
        eventType: 'failed_login',
        severity: 'low',
        metadata: { email: data.email, reason: error.message }
      });
    } else {
      await SecurityLogger.logLogin(authData.user.id);
      
      // Sync Sentry User
      setUser(authData.user.id, data.email);

      navigate("/")
    }
  }

  const onRegister = async (data: RegisterFormValues) => {
    setError(null)
    
    // Validate invitation code against database
    const { data: isValid, error: validateError } = await supabase.rpc(
      'validate_invitation_code' as never,
      { p_code: data.inviteCode } as never
    )
    
    if (validateError || !isValid) {
      setError("Invalid or expired invitation code")
      SecurityLogger.log({
          eventType: 'failed_register_invite',
          severity: 'medium',
          metadata: { email: data.email, inviteCode: data.inviteCode }
      });
      return
    }
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: undefined,
        data: {
          full_name: data.fullName,
          role: 'admin',
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      SecurityLogger.log({
          eventType: 'failed_register',
          severity: 'low',
          metadata: { email: data.email, reason: signUpError.message }
      });
      return
    }

    if (signUpData.user) {
         await SecurityLogger.log({
            eventType: 'register',
            severity: 'info',
            metadata: { email: data.email, inviteCode: data.inviteCode, userId: signUpData.user.id }
         });

         // Sync Sentry User (Lazy)
         const userId = signUpData.user.id;
         import('@/lib/monitoring').then(({ setUser }) => {
           setUser(userId, data.email);
         });
    }

    // Mark invitation code as used
    await supabase.rpc('use_invitation_code' as never, { p_code: data.inviteCode } as never)

    navigate("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Rocket className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Questerix Admin</h1>
          <p className="text-muted-foreground mt-2">
            Curriculum Management System
          </p>
        </div>

        <Card className="border-border/40 shadow-xl">
          <CardHeader>
            <CardTitle>{isRegister ? "Create Account" : "Welcome Back"}</CardTitle>
            <CardDescription>
              {isRegister ? "Enter your details to get started" : "Enter your credentials to access the admin panel"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isRegister ? (
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName"
                    placeholder="John Doe" 
                    {...registerForm.register("fullName")} 
                  />
                  {registerForm.formState.errors.fullName && (
                    <p className="text-sm text-destructive">{registerForm.formState.errors.fullName.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="name@example.com" 
                    {...registerForm.register("email")} 
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password"
                      type={showRegisterPassword ? "text" : "password"}
                      {...registerForm.register("password")} 
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Invitation Code</Label>
                  <Input 
                    id="inviteCode"
                    placeholder="INV-..." 
                    {...registerForm.register("inviteCode")} 
                  />
                  {registerForm.formState.errors.inviteCode && (
                    <p className="text-sm text-destructive">{registerForm.formState.errors.inviteCode.message}</p>
                  )}
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <Button className="w-full" type="submit" disabled={registerForm.formState.isSubmitting}>
                  {registerForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                    {...loginForm.register("email")} 
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      {...loginForm.register("password")} 
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <Button className="w-full" type="submit" disabled={loginForm.formState.isSubmitting}>
                  {loginForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              variant="link"
              onClick={() => {
                setIsRegister(!isRegister)
                setError(null)
              }}
              className="text-muted-foreground"
            >
              {isRegister 
                ? "Already have an account? Sign in" 
                : "Don't have an account? Register"
              }
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
