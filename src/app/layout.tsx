
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';

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
    <html lang="en" className="dark">
      <head>
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased'
        )}
      >
        <AuthProvider>
            {children}
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
