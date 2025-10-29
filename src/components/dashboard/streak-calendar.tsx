'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface StreakCalendarProps {
  streakCount: number;
  // We'll add more props later for the calendar view
}

export function StreakCalendar({ streakCount }: StreakCalendarProps) {
  const hasStreak = streakCount > 0;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
        <Flame className={`h-4 w-4 ${hasStreak ? 'text-orange-500' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        {hasStreak ? (
          <>
            <div className="text-2xl font-bold">{streakCount} days 🔥</div>
            <p className="text-xs text-muted-foreground mt-1">
              Amazing! Keep going to maintain your streak!
            </p>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold text-muted-foreground">Not started</div>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Start your first chat to begin your streak!
            </p>
            <Button size="sm" asChild className="w-full">
              <Link href="/chat">
                <Sparkles className="h-3 w-3 mr-1.5" />
                Start Now
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
