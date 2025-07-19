
'use client';

import { AuthProvider } from './auth-context';
import { AuthModal } from '@/components/auth/auth-modal';
import { OnboardingModal } from '@/components/auth/onboarding-modal';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthModal />
      <OnboardingModal />
      {children}
    </AuthProvider>
  );
}
