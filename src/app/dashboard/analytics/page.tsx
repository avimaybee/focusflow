'use client';

import { MasteryGraph } from '@/components/dashboard/mastery-graph';
import { LearningVelocity } from '@/components/dashboard/learning-velocity';

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 leading-tight">Progress Analytics</h1>
      <div className="grid grid-cols-1 gap-6 mb-6">
        <MasteryGraph />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LearningVelocity />
      </div>
    </div>
  );
}