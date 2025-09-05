'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { MasteryGraph } from '@/components/dashboard/mastery-graph';
import { LearningVelocity } from '@/components/dashboard/learning-velocity';

export default function AnalyticsPage() {
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Placeholder for fetching data from Supabase
    setIsLoading(false);
  }, [user]);

  // In a real app, you would process the activityLog into the format needed by the charts.
  // For now, we'll pass empty data.
  const masteryData: { date: string; [subject: string]: number | string; }[] = [];

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Progress Analytics</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MasteryGraph data={masteryData} />
        <LearningVelocity />
      </div>
    </div>
  );
}