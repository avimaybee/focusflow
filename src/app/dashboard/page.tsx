'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Loader2, FileText, BookOpen, HelpCircle, BrainCircuit, Calendar } from 'lucide-react';
import { StreakCalendar } from '@/components/dashboard/streak-calendar';
import { SubjectPieChart } from '@/components/dashboard/subject-pie-chart';
import { GoalTracker } from '@/components/dashboard/goal-tracker';
import { BadgeGrid } from '@/components/dashboard/badge-grid';
import { WeeklySummaryCard } from '@/components/dashboard/weekly-summary-card';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { SetGoalModal } from '@/components/dashboard/set-goal-modal';
import { getStudyStreak } from '@/lib/dashboard-actions';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch real study streak from database
        const streak = await getStudyStreak(user.id);
        setStreakCount(streak);
      } catch (error) {
        console.error('[Dashboard] Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

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
            <StreakCalendar streakCount={streakCount} />
            <Card className="hover:border-primary/80 hover:bg-muted transition-all cursor-pointer" onClick={() => window.location.href = '/chat'}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Summaries Made</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-muted-foreground">0</div>
                    <p className="text-xs text-muted-foreground mt-1">Chat to create your first!</p>
                </CardContent>
            </Card>
            <Card className="hover:border-primary/80 hover:bg-muted transition-all cursor-pointer" onClick={() => window.location.href = '/chat'}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-muted-foreground">0</div>
                    <p className="text-xs text-muted-foreground mt-1">Generate your first quiz!</p>
                </CardContent>
            </Card>
            <Card className="hover:border-primary/80 hover:bg-muted transition-all cursor-pointer" onClick={() => window.location.href = '/chat'}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Flashcard Sets</CardTitle>
                    <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-muted-foreground">0</div>
                    <p className="text-xs text-muted-foreground mt-1">Create flashcards in chat!</p>
                </CardContent>
            </Card>
            <Card className="hover:border-primary/80 hover:bg-muted transition-all cursor-pointer" onClick={() => window.location.href = '/study-plan/new'}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Study Plans</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-muted-foreground">0</div>
                    <p className="text-xs text-muted-foreground mt-1">Build your first plan!</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SubjectPieChart studyTime={{}} />
            <GoalTracker goals={[]} onSetGoal={() => setIsGoalModalOpen(true)} />
            <BadgeGrid earnedAchievements={[]} />
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
          // Placeholder
        }}
      />
    </main>
  );
}