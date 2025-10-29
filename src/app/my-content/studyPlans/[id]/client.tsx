"use client";

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function StudyPlanViewerPage({ params }: { params: { id: string } }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [plan, setPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Placeholder for fetching data from Supabase
    if (params.id) {
      setPlan({
        title: 'Placeholder Study Plan',
        createdAt: new Date().toISOString(),
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
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">{plan.title}</h1>
        {plan.createdAt && (
          <p className="text-sm text-muted-foreground">
            Created on {format(new Date(plan.createdAt), 'MMMM dd, yyyy')}
          </p>
        )}
      </header>
      <div className="prose mx-auto max-w-none dark:prose-invert">
        {Object.entries(plan.plan).map(([day, tasks]) => (
          <section key={day}>
            <h2 className="mt-8 text-2xl font-semibold">{day}</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              {(tasks as string[]).map((task, index) => (
                <li key={index}>{task}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
