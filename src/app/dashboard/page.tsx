'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Loader2, FileText, BookOpen, HelpCircle, BrainCircuit, Calendar } from 'lucide-react';
import { getGoals, setGoal } from '@/lib/dashboard-actions';
import { StreakCalendar } from '@/components/dashboard/streak-calendar';
import { SubjectPieChart } from '@/components/dashboard/subject-pie-chart';
import { GoalTracker } from '@/components/dashboard/goal-tracker';
import { BadgeGrid } from '@/components/dashboard/badge-grid';
import { WeeklySummaryCard } from '@/components/dashboard/weekly-summary-card';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { SetGoalModal } from '@/components/dashboard/set-goal-modal';
import Link from 'next/link';

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
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">My Dashboard</h1>
            <Link href="/dashboard/analytics">
                <Button variant="outline">View Detailed Analytics</Button>
            </Link>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-6">
            <StreakCalendar streakCount={userData?.streakCount || 0} />
            <Link href="/my-content?tab=Summaries">
                <Card className="hover:border-primary/80 hover:bg-muted transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Summaries Made</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {userData?.summariesCount || 0}
                        </div>
                    </CardContent>
                </Card>
            </Link>
            <Link href="/my-content?tab=Quizzes">
                <Card className="hover:border-primary/80 hover:bg-muted transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {userData?.quizzesCount || 0}
                        </div>
                    </CardContent>
                </Card>
            </Link>
            <Link href="/my-content?tab=Flashcards">
                <Card className="hover:border-primary/80 hover:bg-muted transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Flashcard Sets</CardTitle>
                        <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {userData?.flashcardSetsCount || 0}
                        </div>
                    </CardContent>
                </Card>
            </Link>
            <Link href="/my-content?tab=Study Plans">
                <Card className="hover:border-primary/80 hover:bg-muted transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Study Plans</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {userData?.studyPlansCount || 0}
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SubjectPieChart studyTime={userData?.studyTime || {}} />
            <GoalTracker goals={goals} onSetGoal={() => setIsGoalModalOpen(true)} />
            <BadgeGrid earnedAchievements={userData?.achievements || []} />
        </div>

        <div className="grid grid-cols-1 gap-6 mt-6">
            <WeeklySummaryCard />
        </div>

        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Advanced Study Tools</h2>
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="hover:border-primary/80 hover:bg-muted transition-all">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Practice Exams
                        </CardTitle>
                        <CardDescription>
                            Generate full-length practice exams to test your knowledge.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/practice-exam/new">
                            <Button>Create New Exam</Button>
                        </Link>
                    </CardContent>
                </Card>
                <Card className="hover:border-primary/80 hover:bg-muted transition-all">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            AI-Created Study Plans
                        </CardTitle>
                        <CardDescription>
                            Let our AI create a personalized study plan for you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/study-plan/new">
                            <Button>Create New Plan</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
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
