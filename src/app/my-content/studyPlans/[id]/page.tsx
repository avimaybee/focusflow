'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { updateLastViewed } from '@/lib/content-actions';
import { Loader2 } from 'lucide-react';

export default function StudyPlanViewerPage({ params }: { params: { id: string } }) {
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
        updateLastViewed(user.uid, params.id, 'studyPlan');
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
