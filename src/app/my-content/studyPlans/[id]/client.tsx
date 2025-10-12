"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function StudyPlanViewerPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [plan, setPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Placeholder for fetching data from Supabase
    if (params.id) {
        setPlan({
            title: 'Placeholder Study Plan',
            plan: {
                'Day 1': ['Introduction to Topic', 'Read Chapter 1'],
                'Day 2': ['Practice Problems', 'Review Chapter 1'],
            },
        });
    }
    setIsLoading(false);
  }, [params.id]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!plan) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="prose dark:prose-invert lg:prose-xl mx-auto">
        <h1>{plan.title}</h1>
        {Object.entries(plan.plan).map(([day, tasks]) => (
          <div key={day}>
            <h2 className="text-2xl font-semibold mt-8 mb-4">{day}</h2>
            <ul className="list-disc pl-6 space-y-2">
              {(tasks as string[]).map((task, index) => (
                <li key={index}>{task}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
