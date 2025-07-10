
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import { Poppins, PT_Sans } from 'next/font/google';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  weight: ['400', '600', '700'],
});

const pt_sans = PT_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pt-sans',
  weight: ['400', '700'],
});


export const metadata: Metadata = {
  title: 'FocusFlow AI: AI Summarizer, Flashcards, Quizzes & Study Planner',
  description:
    'The ultimate AI-powered study toolkit. Generate summaries, flashcards, and quizzes from your notes. Create personalized study plans and track your progress. Study smarter with FocusFlow AI.',
  keywords: ['AI study tools', 'note summarizer', 'flashcard generator', 'quiz creator', 'study planner', 'student productivity', 'exam prep'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", poppins.variable, pt_sans.variable)}>
      <head>
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased flex flex-col'
        )}
      >
        <AuthProvider>
            <Header />
            <main className="flex-grow flex flex-col">{children}</main>
            <Footer />
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
