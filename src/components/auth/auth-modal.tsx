
'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { useAuth } from '@/context/auth-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const signupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

type FormState = 'idle' | 'loading' | 'success';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.021,35.596,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

export function AuthModal() {
  const { isOpen, view, layoutId, setView, onClose } = useAuthModal();
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [formState, setFormState] = useState<FormState>('idle');

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    // Only trigger success redirect if a REAL user is logged in.
    if (user && !isGuest && isOpen) {
      setFormState('success');
      setTimeout(() => {
        onClose();
        router.push('/chat');
      }, 1500);
    }
  }, [user, isGuest, isOpen, onClose, router]);
  
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFormState('idle');
        loginForm.reset();
        signupForm.reset();
      }, 300);
    }
  }, [isOpen, loginForm, signupForm]);

  const handleAuthAction = async (
    action: (email: string, pass: string) => Promise<any>,
    values: LoginFormValues | SignupFormValues,
    successMessage: string
  ) => {
    setFormState('loading');
    try {
      await action(values.email, values.password);
      toast({ title: 'Success!', description: successMessage });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Authentication Failed', description: error.message });
      setFormState('idle');
    }
  };

  const handleLogin = (values: LoginFormValues) => {
    handleAuthAction(
      (email, password) => supabase.auth.signInWithPassword({ email, password }),
      values,
      "Welcome back!"
    );
  };
  
  const handleSignup = (values: SignupFormValues) => {
    handleAuthAction(
      async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              displayName: email.split('@')[0],
            },
          },
        });
        if (error) throw error;
      },
      values,
      "Welcome to FocusFlow AI!"
    );
  };
  
  const handleGoogleSignIn = async () => {
    setFormState('loading');
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) throw error;
        // Supabase signInWithOAuth redirects, so no need for toast here immediately
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Google Sign-In Failed', description: error.message });
        setFormState('idle');
    }
  }

  const isLoading = formState === 'loading';

  const AuthForm = ({ isSignup }: { isSignup: boolean }) => {
    const form = isSignup ? signupForm : loginForm;
    const onSubmit = isSignup ? handleSignup : handleLogin;
    
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={isSignup ? 'signup' : 'login'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.2 } }}
          exit={{ opacity: 0, y: -10, transition: { duration: 0.1 } }}
          className="w-full"
        >
          <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                      <FormItem>
                          <Label htmlFor={isSignup ? 'signup-email' : 'login-email'}>Email</Label>
                          <FormControl>
                          <Input id={isSignup ? 'signup-email' : 'login-email'} type="email" placeholder="you@example.com" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                      <FormItem>
                          <Label htmlFor={isSignup ? 'signup-password' : 'login-password'}>Password</Label>
                          <FormControl>
                          <Input id={isSignup ? 'signup-password' : 'login-password'} type="password" {...field} disabled={isLoading}/>
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isSignup ? 'Create Account' : 'Log In')}
                  </Button>
              </form>
          </Form>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            layoutId={layoutId || 'auth-modal-fallback'}
            className="bg-secondary rounded-lg shadow-xl w-full max-w-sm"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <AnimatePresence mode="wait">
                {formState === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1, transition: { delay: 0.2 } }}
                    className="flex flex-col items-center justify-center p-8 h-[370px]"
                  >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, transition: { type: 'spring', stiffness: 300, damping: 20, delay: 0.3 } }}
                        className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center"
                    >
                      <Check className="h-8 w-8 text-green-500" />
                    </motion.div>
                    <p className="mt-4 text-lg font-medium">Success!</p>
                    <p className="text-sm text-muted-foreground">Redirecting you now...</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    className="w-full flex flex-col items-center"
                  >
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.2 } }}
                      className="w-full"
                    >
                      <div className="flex justify-between items-center mb-4 w-full">
                          <h2 className="text-xl font-bold">{view === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                      </div>

                      <div className="space-y-4 w-full">
                          <AuthForm isSignup={view === 'signup'} />

                          <div className="relative my-4">
                              <div className="absolute inset-0 flex items-center">
                                  <span className="w-full border-t" />
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                  <span className="bg-secondary px-2 text-muted-foreground">Or</span>
                              </div>
                          </div>

                          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                              Continue with Google
                          </Button>

                          <p className="text-center text-sm text-muted-foreground">
                              {view === 'login' ? "Don't have an account?" : "Already have an account?"}
                              <Button variant="link" className="p-1" onClick={() => setView(view === 'login' ? 'signup' : 'login')}>
                                  {view === 'login' ? 'Sign up' : 'Log in'}
                              </Button>
                          </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
