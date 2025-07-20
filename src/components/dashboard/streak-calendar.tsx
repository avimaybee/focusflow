'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame } from 'lucide-react';

interface StreakCalendarProps {
  streakCount: number;
  // We'll add more props later for the calendar view
}

export function StreakCalendar({ streakCount }: StreakCalendarProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
        <Flame className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{streakCount} days</div>
        <p className="text-xs text-muted-foreground">
          Keep it up to build your study habit!
        </p>
      </CardContent>
    </Card>
  );
}
