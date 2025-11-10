
'use client';

import { useState, useEffect, useCallback } from 'react';
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

export function AuthModal() {
  const { isOpen, view, layoutId, setView, onClose } = useAuthModal();
  const { user, isGuest, refreshAuthStatus } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [formState, setFormState] = useState<FormState>('idle');
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveLayoutId(null);
      return;
    }

    if (!layoutId) {
      setActiveLayoutId(null);
      return;
    }

    setActiveLayoutId(layoutId);

    const raf = requestAnimationFrame(() => {
      // Detach from shared layout after the opening animation so Framer Motion
      // stops re-parenting the modal content on every render (which was
      // forcing the inputs to lose focus after the first keystroke).
      setActiveLayoutId(null);
    });

    return () => cancelAnimationFrame(raf);
  }, [isOpen, layoutId]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    // If the user is successfully logged in (not a guest),
    // and the auth modal is open, it means they just logged in.
    // So, we should close the modal and redirect them.
    if (user && !isGuest && isOpen) {
      // We can keep the success message showing for a bit before redirecting.
      setFormState('success'); // Ensure success UI is shown
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
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, loginForm, signupForm, onClose]);

  const handleAuthAction = useCallback(async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: (email: string, pass: string) => Promise<any>,
    values: LoginFormValues | SignupFormValues,
    successMessage: string
  ) => {
    setFormState('loading');
    try {
      const { error } = await action(values.email, values.password);
      if (error) throw error;

      await refreshAuthStatus();

      toast({ title: 'Success!', description: successMessage });
      setFormState('success');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Authentication Failed', description: error.message });
      setFormState('idle');
    }
  }, [refreshAuthStatus, toast]);

  const handleLogin = useCallback((values: LoginFormValues) => {
    handleAuthAction(
      (email, password) => supabase.auth.signInWithPassword({ email, password }),
      values,
      "Welcome back!"
    );
  }, [handleAuthAction]);
  
  const handleSignup = useCallback((values: SignupFormValues) => {
    handleAuthAction(
      (email, password) => supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            displayName: email.split('@')[0],
          },
        },
      }),
      values,
      "Welcome to FocusFlow AI!"
    );
  }, [handleAuthAction]);

  const isLoading = formState === 'loading';

  const AuthForm = ({ isSignup }: { isSignup: boolean }) => {
    const form = isSignup ? signupForm : loginForm;
    const onSubmit = isSignup ? handleSignup : handleLogin;
    
    return (
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
                        <Input id={isSignup ? 'signup-email' : 'login-email'} type="email" placeholder="you@example.com" {...field} disabled={isLoading} autoComplete="email" />
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
                        <Input id={isSignup ? 'signup-password' : 'login-password'} type="password" {...field} disabled={isLoading} autoComplete={isSignup ? 'new-password' : 'current-password'}/>
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
            layoutId={activeLayoutId ?? 'auth-modal-fallback'}
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
                    className="relative flex flex-col items-center justify-center p-8 h-[370px]"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      aria-label="Close authentication modal"
                      className="absolute right-4 top-4"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, transition: { type: 'spring', stiffness: 300, damping: 20, delay: 0.3 } }}
                        className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center"
                    >
                      <Check className="h-8 w-8 text-green-500" />
                    </motion.div>
                    <p className="mt-4 text-lg font-semibold text-foreground">Success!</p>
                    <p className="text-sm text-foreground/70 font-medium">Redirecting you now...</p>
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            aria-label="Close authentication modal"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                      </div>

                      <div className="space-y-4 w-full">
                          <AuthForm isSignup={view === 'signup'} />

                          <p className="text-center text-sm text-foreground/70 font-medium">
                              {view === 'login' ? "Don't have an account?" : "Already have an account?"}
                              <Button variant="link" className="p-1 font-semibold text-primary" onClick={() => setView(view === 'login' ? 'signup' : 'login')}>
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
