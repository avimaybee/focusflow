"use client";

import { Loader2 } from 'lucide-react';
import { useParams, notFound } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { QuizViewer } from '@/components/quiz-viewer';
import { format } from 'date-fns';

interface Quiz {
    title: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    quiz: any;
    createdAt: Date; // Replaced Timestamp with Date
}

export default function QuizDetailPage() {
  const { loading: authLoading } = useAuth();
  const params = useParams();
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
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">{quiz.title}</h1>
        <p className="text-sm text-muted-foreground">
          Created on {format(quiz.createdAt, 'MMMM dd, yyyy')}
        </p>
      </header>
      {quiz.quiz ? (
        <QuizViewer quiz={quiz.quiz} />
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 bg-secondary/30 px-6 py-12 text-center text-sm text-muted-foreground">
          This quiz could not be loaded right now.
        </div>
      )}
    </div>
  );
}
