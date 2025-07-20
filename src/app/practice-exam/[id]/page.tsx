'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { notFound, useRouter } from 'next/navigation';
import { ExamViewer } from '@/components/exam-viewer';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PracticeExamPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [examSession, setExamSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchExam = async () => {
      const docRef = doc(db, 'users', user.uid, 'examSessions', params.id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setExamSession({ id: docSnap.id, ...docSnap.data() });
      } else {
        notFound();
      }
      setIsLoading(false);
    };

    fetchExam();
  }, [user, params.id]);

  const handleSubmit = async (answers: any) => {
    if (!user) return;
    
    // In a real app, you would have a server-side function to grade the exam.
    // For now, we'll just save the answers.
    const docRef = doc(db, 'users', user.uid, 'examSessions', params.id);
    await updateDoc(docRef, {
      answers,
      status: 'completed',
    });

    toast({ title: 'Exam Submitted!', description: 'Your exam has been submitted for grading.' });
    router.push(`/practice-exam/${params.id}/review`);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!examSession) {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <ExamViewer exam={examSession.exam} onSubmit={handleSubmit} />
    </main>
  );
}
