'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
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
    // Placeholder for fetching data from Supabase
    if (params.id) {
        setExamSession({
            id: params.id,
            exam: {
                title: 'Placeholder Practice Exam',
                questions: [
                    {
                        question: 'What is the capital of France?',
                        options: ['London', 'Berlin', 'Paris', 'Madrid'],
                        correctAnswer: 'Paris',
                        explanation: 'Paris is the capital of France.',
                        questionType: 'multiple-choice',
                    },
                ],
            },
        });
    }
    setIsLoading(false);
  }, [params.id]);

  const handleSubmit = async (answers: any) => {
    // Placeholder for submit logic
    toast({ title: 'Exam Submitted!', description: 'Your exam has been submitted (placeholder).' });
    router.push(`/practice-exam/${params.id}/review`);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!examSession) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <ExamViewer exam={examSession.exam} onSubmit={handleSubmit} />
    </main>
  );
}