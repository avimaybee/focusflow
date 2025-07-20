'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { updateLastViewed } from '@/lib/content-actions';
import { Loader2 } from 'lucide-react';
import { QuizViewer } from '@/components/quiz-viewer';

export default function QuizViewerPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchQuiz = async () => {
      const docRef = doc(db, 'users', user.uid, 'quizzes', params.id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setQuiz(docSnap.data());
        updateLastViewed(user.uid, params.id, 'quiz');
      } else {
        notFound();
      }
      setIsLoading(false);
    };

    fetchQuiz();
  }, [user, params.id]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!quiz) {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <QuizViewer quiz={quiz.quiz} />
    </main>
  );
}
