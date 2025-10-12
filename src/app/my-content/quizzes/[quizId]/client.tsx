"use client";

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { QuizViewer } from '@/components/quiz-viewer';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';

interface Quiz {
    title: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    quiz: any;
    createdAt: Date; // Replaced Timestamp with Date
}

export default function QuizDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Placeholder for fetching data from Supabase
    if (quizId) {
        setQuiz({
            title: 'Placeholder Quiz',
            quiz: {
                title: 'Placeholder Quiz',
                questions: [
                    {
                        question: 'What is the capital of France?',
                        options: ['London', 'Berlin', 'Paris', 'Madrid'],
                        correctAnswer: 'Paris',
                        explanation: 'Paris is the capital of France.',
                    },
                ],
            },
            createdAt: new Date(),
        });
    }
    setIsLoading(false);
  }, [quizId]);

  if (isLoading || authLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quiz) {
    notFound();
  }

  return (
    <main className="flex-grow bg-secondary/30">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <BackButton href="/my-content" label="Back to My Content" className="mb-4" />
            {quiz.quiz ? (
                <QuizViewer quiz={quiz.quiz} />
            ) : (
                <p>This quiz could not be loaded.</p>
            )}
        </div>
    </main>
  );
}
