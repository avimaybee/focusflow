
'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QuizViewer } from '@/components/quiz-viewer';
import { Button } from '@/components/ui/button';

interface Quiz {
    title: string;
    quiz: any;
    createdAt: Timestamp;
}

export default function QuizDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        router.push('/login');
        return;
    }

    if (user && quizId) {
        const fetchQuiz = async () => {
            setIsLoading(true);
            const docRef = doc(db, 'users', user.uid, 'quizzes', quizId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setQuiz(docSnap.data() as Quiz);
            } else {
                setQuiz(null);
            }
            setIsLoading(false);
        };
        fetchQuiz();
    }
  }, [user, quizId, authLoading, router]);

  if (isLoading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
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
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/my-content">← Back to My Content</Link>
            </Button>
            {quiz.quiz ? (
                <QuizViewer quiz={quiz.quiz} />
            ) : (
                <p>This quiz could not be loaded.</p>
            )}
        </div>
    </main>
  );
}
