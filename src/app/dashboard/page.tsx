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
import { getDashboardStats } from '@/lib/analytics-actions';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [summariesCount, setSummariesCount] = useState(0);
  const [quizzesCount, setQuizzesCount] = useState(0);
  const [flashcardsCount, setFlashcardsCount] = useState(0);
  const [studyPlansCount, setStudyPlansCount] = useState(0);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch real study streak and stats from database
        const [streak, stats] = await Promise.all([
          getStudyStreak(user.id),
          getDashboardStats(user.id),
        ]);
        
        setStreakCount(streak);
        setSummariesCount(stats.summariesCount);
        setQuizzesCount(stats.quizzesCount);
        setFlashcardsCount(stats.flashcardsCount);
        setStudyPlansCount(stats.studyPlansCount);
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
      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-10">
            <h1 className="text-3xl font-bold leading-tight">My Dashboard</h1>
            <Link href="/dashboard/analytics">
                <Button variant="outline" className="h-10">View Detailed Analytics</Button>
            </Link>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
            <StreakCalendar streakCount={streakCount} />
            <Card className="hover:border-primary/80 hover:bg-muted transition-all cursor-pointer group" onClick={() => window.location.href = '/chat'}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-bold leading-none text-foreground/90">Summaries Made</CardTitle>
                    <FileText className="h-4 w-4 text-foreground/60" />
                </CardHeader>
                <CardContent className="pb-4">
                    <div className={`text-2xl font-bold mb-2 leading-none ${summariesCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {summariesCount}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold text-primary hover:bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        {summariesCount > 0 ? 'Create More →' : 'Start Now →'}
                    </Button>
                </CardContent>
            </Card>
            <Card className="hover:border-primary/80 hover:bg-muted transition-all cursor-pointer group" onClick={() => window.location.href = '/chat'}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-bold leading-none text-foreground/90">Quizzes Taken</CardTitle>
                    <HelpCircle className="h-4 w-4 text-foreground/60" />
                </CardHeader>
                <CardContent className="pb-4">
                    <div className={`text-2xl font-bold mb-2 leading-none ${quizzesCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {quizzesCount}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold text-primary hover:bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        {quizzesCount > 0 ? 'Create More →' : 'Create First →'}
                    </Button>
                </CardContent>
            </Card>
            <Card className="hover:border-primary/80 hover:bg-muted transition-all cursor-pointer group" onClick={() => window.location.href = '/chat'}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-bold leading-none text-foreground/90">Flashcard Sets</CardTitle>
                    <BrainCircuit className="h-4 w-4 text-foreground/60" />
                </CardHeader>
                <CardContent className="pb-4">
                    <div className={`text-2xl font-bold mb-2 leading-none ${flashcardsCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {flashcardsCount}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold text-primary hover:bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        {flashcardsCount > 0 ? 'Create More →' : 'Create First →'}
                    </Button>
                </CardContent>
            </Card>
            <Card className="hover:border-primary/80 hover:bg-muted transition-all cursor-pointer group" onClick={() => window.location.href = '/study-plan/new'}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-bold leading-none text-foreground/90">Study Plans</CardTitle>
                    <Calendar className="h-4 w-4 text-foreground/60" />
                </CardHeader>
                <CardContent className="pb-4">
                    <div className={`text-2xl font-bold mb-2 leading-none ${studyPlansCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {studyPlansCount}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold text-primary hover:bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        {studyPlansCount > 0 ? 'Create More →' : 'Build First →'}
                    </Button>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <SubjectPieChart studyTime={{}} />
            <GoalTracker goals={[]} onSetGoal={() => setIsGoalModalOpen(true)} />
            <BadgeGrid earnedAchievements={[]} />
        </div>

        <div className="grid grid-cols-1 gap-6">
            <WeeklySummaryCard />
        </div>

        <div className="mt-10">
            <h2 className="text-2xl font-bold mb-6 leading-tight">Advanced Study Tools</h2>
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="hover:border-primary/80 hover:bg-muted transition-all group">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Practice Exams
                        </CardTitle>
                        <CardDescription className="text-foreground/70 font-medium">
                            Generate full-length practice exams to test your knowledge.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/practice-exam/new">
                            <Button className="h-10 font-semibold shadow-md hover:shadow-lg transition-shadow duration-200 w-full sm:w-auto">
                                Generate Practice Exam →
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
                <Card className="hover:border-primary/80 hover:bg-muted transition-all group">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            AI-Created Study Plans
                        </CardTitle>
                        <CardDescription className="text-foreground/70 font-medium">
                            Let our AI create a personalized study plan for you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/study-plan/new">
                            <Button className="h-10 font-semibold shadow-md hover:shadow-lg transition-shadow duration-200 w-full sm:w-auto">
                                Create Study Plan →
                            </Button>
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