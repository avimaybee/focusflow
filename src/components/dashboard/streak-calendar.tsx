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
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium leading-none">Study Streak</CardTitle>
        <Flame className={`h-4 w-4 ${hasStreak ? 'text-orange-500' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent className="pb-4">
        {hasStreak ? (
          <>
            <div className="text-2xl font-bold mb-2 leading-none">{streakCount} days 🔥</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Amazing! Keep going to maintain your streak!
            </p>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold text-muted-foreground mb-2 leading-none">Not started</div>
            <Button size="sm" asChild className="w-full h-9 font-semibold shadow-md hover:shadow-lg transition-shadow duration-200 mt-2">
              <Link href="/chat">
                <Sparkles className="h-3 w-3 mr-1.5" />
                Start Now →
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
