"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getStudyPlan, updateTaskStatus, type StudyPlanData } from '@/lib/study-plan-data-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar,
  CheckCircle2, 
  Clock, 
  Target,
  BookOpen,
  TrendingUp,
  Home,
  Share2,
  Edit,
  Loader2,
  AlertCircle,
  Sparkles,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function StudyPlanPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [plan, setPlan] = useState<StudyPlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPlan() {
      if (!params.id || params.id === 'undefined' || !user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const data = await getStudyPlan(params.id, user.id);
        setPlan(data);
      } catch (error) {
        console.error('Error loading study plan:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPlan();
  }, [params.id, user]);

  const handleTaskToggle = async (dayIndex: number, taskId: string) => {
    if (!plan || !user) return;
    
    const updatedPlan = { ...plan };
    const task = updatedPlan.days[dayIndex].tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      
      // Recalculate progress
      const totalTasks = updatedPlan.days.reduce((sum, day) => sum + day.tasks.length, 0);
      const completedTasks = updatedPlan.days.reduce(
        (sum, day) => sum + day.tasks.filter(t => t.completed).length,
        0
      );
      updatedPlan.completedTasks = completedTasks;
      updatedPlan.progress = Math.round((completedTasks / totalTasks) * 100);
      
      setPlan(updatedPlan);
      
      // Save to database
      await updateTaskStatus(plan.id, user.id, taskId, task.completed);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your study plan...</p>
      </div>
    );
  }

  if (!plan || params.id === 'undefined') {
    return (
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Study Plan Not Found</CardTitle>
            </div>
            <CardDescription>
              We couldn't find the study plan you're looking for. This might be because:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>The plan ID is invalid or has been deleted</li>
              <li>You don't have permission to view this plan</li>
              <li>The plan hasn't been created yet</li>
            </ul>
            <div className="flex gap-3 pt-4">
              <Button asChild variant="default">
                <Link href="/study-plan/new">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create New Plan
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/my-content">
                  <Home className="h-4 w-4 mr-2" />
                  Go to My Content
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{plan.title}</h1>
            <p className="text-muted-foreground leading-relaxed">{plan.description}</p>
          </div>
          <Badge variant="outline" className="shrink-0">
            <BookOpen className="h-3 w-3 mr-1" />
            {plan.subject}
          </Badge>
        </div>

        {/* Progress Overview Card */}
        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Overall Progress</CardTitle>
              <Badge variant={plan.progress >= 70 ? 'default' : 'secondary'} className="text-base px-3 py-1">
                {plan.progress}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={plan.progress} className="h-3" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-primary/5 border">
                <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold">{plan.completedTasks}/{plan.totalTasks}</p>
                <p className="text-xs text-muted-foreground">Tasks Done</p>
              </div>
              
              <div className="text-center p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <Calendar className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <p className="text-xl font-bold">{plan.durationWeeks}</p>
                <p className="text-xs text-muted-foreground">Weeks Total</p>
              </div>
              
              <div className="text-center p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                <Clock className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <p className="text-xl font-bold">{plan.startDate}</p>
                <p className="text-xs text-muted-foreground">Start Date</p>
              </div>
              
              {plan.examDate && (
                <div className="text-center p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                  <p className="text-xl font-bold">{plan.examDate}</p>
                  <p className="text-xs text-muted-foreground">Exam Date</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit Plan
        </Button>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Link>
        </Button>
      </div>

      <Separator className="my-6" />

      {/* Daily Schedule */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Daily Schedule</h2>
        
        {plan.days.map((day, dayIndex) => (
          <Card 
            key={day.day} 
            className={cn(
              "border-l-4 transition-all",
              day.isToday && "border-l-primary bg-primary/5 shadow-lg",
              !day.isToday && day.isPast && "border-l-muted-foreground/30 opacity-80",
              !day.isToday && !day.isPast && "border-l-blue-500"
            )}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant={day.isToday ? 'default' : 'outline'}>
                      Day {day.day}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{day.date}</span>
                    {day.isToday && (
                      <Badge variant="secondary" className="animate-pulse">
                        <Clock className="h-3 w-3 mr-1" />
                        Today
                      </Badge>
                    )}
                    {day.isPast && (
                      <Badge variant="outline" className="bg-muted">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{day.topic}</CardTitle>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {day.tasks.filter(t => t.completed).length}/{day.tasks.length} done
                  </p>
                  <CheckCircle2 
                    className={cn(
                      "h-6 w-6 mt-1",
                      day.tasks.every(t => t.completed) ? "text-green-600" : "text-muted-foreground/30"
                    )} 
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {day.tasks.map((task) => (
                  <li key={task.id} className="flex items-start gap-3 group">
                    <Checkbox 
                      id={task.id}
                      checked={task.completed}
                      onCheckedChange={() => handleTaskToggle(dayIndex, task.id)}
                      className="mt-1"
                    />
                    <label 
                      htmlFor={task.id}
                      className={cn(
                        "flex-1 leading-relaxed cursor-pointer transition-colors",
                        task.completed && "line-through text-muted-foreground",
                        !task.completed && "group-hover:text-primary"
                      )}
                    >
                      {task.text}
                    </label>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 text-center bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-2 border-primary/20 rounded-xl p-8">
        <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h3 className="text-2xl font-bold mb-2">Stay Consistent!</h3>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          You're making great progress! Keep following your plan and you'll master {plan.subject} in no time.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button asChild size="lg">
            <Link href="/study-plan/new">
              Create Another Plan
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/practice-exam/new">
              Take Practice Exam
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/my-content">
              View All Content
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
