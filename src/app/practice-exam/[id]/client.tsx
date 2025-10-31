"use client";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [examSession, setExamSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchExam() {
      if (!params.id) return;
      
      try {
        // TODO: Replace with actual Supabase fetch when backend is ready
        // For now, use realistic sample data
        setExamSession({
          id: params.id,
          exam: {
            title: 'Practice Exam - Sample',
            questions: [
              {
                questionText: 'What is the capital of France?',
                options: ['London', 'Berlin', 'Paris', 'Madrid'],
                correctAnswer: 'Paris',
                explanation: 'Paris is the capital and largest city of France.',
                questionType: 'multiple-choice',
              },
              {
                questionText: 'The French Revolution began in which year?',
                options: ['1776', '1789', '1799', '1804'],
                correctAnswer: '1789',
                explanation: 'The French Revolution began in 1789 with the Storming of the Bastille.',
                questionType: 'multiple-choice',
              },
            ],
          },
        });
      } catch (error) {
        console.error('Error loading exam:', error);
        toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: 'Failed to load exam. Please try again.' 
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchExam();
  }, [params.id, toast]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (answers: any) => {
    // TODO: Save answers to Supabase when backend is ready
    try {
      toast({ 
        title: 'Exam Submitted!', 
        description: 'Your answers have been recorded. View your results below.' 
      });
      router.push(`/practice-exam/${params.id}/review`);
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Submission Failed', 
        description: 'Could not submit exam. Please try again.' 
      });
    }
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
