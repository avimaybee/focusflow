
import type { Metadata } from 'next';
import { Poppins, PT_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/context/providers';
import { AuthModal } from '@/components/auth/auth-modal';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PageTransitionWrapper } from '@/components/layout/page-transition-wrapper';

const fontHeading = Poppins({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '600', '700'],
});

const fontBody = PT_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'FocusFlow AI: AI Summarizer, Flashcards, Quizzes & Study Planner',
  description:
    'The ultimate AI-powered study toolkit. Generate summaries, flashcards, and quizzes from your notes. Create personalized study plans and track your progress. Study smarter with FocusFlow AI.',
  keywords: [
    'AI study tools',
    'note summarizer',
    'flashcard generator',
    'quiz creator',
    'study planner',
    'student productivity',
    'exam prep',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased flex flex-col',
          fontHeading.variable,
          fontBody.variable
        )}
      >
        <Providers>
          <AuthModal />
          <Header />
          <PageTransitionWrapper>{children}</PageTransitionWrapper>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}


