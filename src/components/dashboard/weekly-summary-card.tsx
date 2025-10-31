'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, MessageSquare, BookOpen, Award, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getWeeklyStats, type WeeklyStats } from '@/lib/analytics-actions';
import { useAuth } from '@/context/auth-context';

export function WeeklySummaryCard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const weeklyStats = await getWeeklyStats(user.id);
        setStats(weeklyStats);
      } catch (error) {
        console.error('Error fetching weekly stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  const hasActivity = stats && (
    stats.chatsThisWeek > 0 || 
    stats.studySessionsThisWeek > 0 || 
    stats.goalsCompleted > 0
  );

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Your Weekly Report</CardTitle>
          <CardDescription>Loading your stats...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasActivity) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Your Weekly Report</CardTitle>
          <CardDescription>Track your learning progress throughout the week.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Start Your Learning Journey</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Your weekly stats will appear here once you start chatting, creating study materials, and completing goals.
            </p>
            <Button size="lg" className="h-11 font-semibold" asChild>
              <Link href="/chat">
                <Sparkles className="h-4 w-4 mr-2" />
                Start Learning Now
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chatTrend = stats.chatsThisWeek - stats.chatsLastWeek;
  const sessionTrend = stats.studySessionsThisWeek - stats.studySessionsLastWeek;
  
  const weeklyData = [
    { 
      label: 'Chats this week', 
      value: stats.chatsThisWeek, 
      icon: MessageSquare, 
      trend: chatTrend > 0 ? `+${chatTrend} from last week` : chatTrend < 0 ? `${chatTrend} from last week` : 'Same as last week'
    },
    { 
      label: 'Study materials', 
      value: stats.studySessionsThisWeek, 
      icon: BookOpen, 
      trend: sessionTrend > 0 ? `+${sessionTrend} from last week` : sessionTrend < 0 ? `${sessionTrend} from last week` : 'Same as last week'
    },
    { 
      label: 'Goals completed', 
      value: stats.goalsCompleted, 
      icon: Award, 
      trend: stats.goalsCompleted > 0 ? 'Great progress!' : 'Set goals to track'
    },
  ];

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Weekly Report</CardTitle>
            <CardDescription>Here&apos;s how you did this past week.</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-primary font-semibold">
            <TrendingUp className="h-4 w-4" />
            <span>This Week</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {weeklyData.map((stat, index) => (
            <div
              key={index}
              className="flex items-start gap-4 rounded-lg border border-border/60 bg-secondary/30 p-4"
            >
              <div className="rounded-full bg-primary/10 p-2">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-xs text-primary">{stat.trend}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
