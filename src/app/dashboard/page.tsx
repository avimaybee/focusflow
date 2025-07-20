'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { getGoals, setGoal } from '@/lib/dashboard-actions';
import { StreakCalendar } from '@/components/dashboard/streak-calendar';
import { SubjectPieChart } from '@/components/dashboard/subject-pie-chart';
import { GoalTracker } from '@/components/dashboard/goal-tracker';
import { BadgeGrid } from '@/components/dashboard/badge-grid';
import { WeeklySummaryCard } from '@/components/dashboard/weekly-summary-card';
import { SetGoalModal } from '@/components/dashboard/set-goal-modal';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    // Listener for the main user document
    const userUnsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
      setIsLoading(false);
    });

    // Fetch goals for the current week
    // (Simplified for now - will add proper week start date logic later)
    const weekStartDate = new Date().toISOString().split('T')[0];
    getGoals(user.uid, weekStartDate).then(setGoals);

    return () => {
      userUnsub();
    };
  }, [user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex-grow bg-secondary/30">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StreakCalendar streakCount={userData?.streakCount || 0} />
            <SubjectPieChart studyTime={userData?.studyTime || {}} />
            <GoalTracker goals={goals} onSetGoal={() => setIsGoalModalOpen(true)} />
            <BadgeGrid earnedAchievements={userData?.achievements || []} />
        </div>

        <div className="grid grid-cols-1 gap-6">
            <WeeklySummaryCard />
        </div>
      </div>
      
      <SetGoalModal 
        isOpen={isGoalModalOpen}
        onOpenChange={setIsGoalModalOpen}
        onSuccess={() => {
          if (!user) return;
          const weekStartDate = new Date().toISOString().split('T')[0];
          getGoals(user.uid, weekStartDate).then(setGoals);
        }}
      />
    </main>
  );
}
