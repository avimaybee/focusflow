'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export default function StudyPlanPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPlan = async () => {
      const docRef = doc(db, 'users', user.uid, 'studyPlans', params.id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setPlan(docSnap.data());
      } else {
        notFound();
      }
      setIsLoading(false);
    };

    fetchPlan();
  }, [user, params.id]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!plan) {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">{plan.title}</h1>
      <div className="space-y-6">
        {plan.plan.map((day: any) => (
          <Card key={day.day}>
            <CardHeader>
              <CardTitle>Day {day.day}: {day.topic}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {day.tasks.map((task: string, index: number) => (
                  <li key={index} className="flex items-center gap-2">
                    <Checkbox id={`task-${day.day}-${index}`} />
                    <label htmlFor={`task-${day.day}-${index}`}>{task}</label>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
