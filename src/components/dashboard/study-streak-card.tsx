'use client';

import { Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StudyStreakCardProps {
  streak: number;
}

const getStreakData = (streak: number) => {
  if (streak === 0) {
    return {
      color: 'text-muted-foreground',
      glow: 'shadow-none',
      message: "Log a session to start a new streak!",
    };
  }
  if (streak < 3) {
    return {
      color: 'text-amber-500',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]',
      message: "You're just getting started!",
    };
  }
  if (streak < 7) {
    return {
      color: 'text-orange-500',
      glow: 'shadow-[0_0_20px_rgba(249,115,22,0.6)]',
      message: "You're on fire! Keep it up.",
    };
  }
  return {
    color: 'text-red-500',
    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.7)]',
    message: "Incredible! You're a true study warrior.",
  };
};

export function StudyStreakCard({ streak }: StudyStreakCardProps) {
  const { color, glow, message } = getStreakData(streak);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
        <Flame className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center gap-2">
        <motion.div
          key={streak}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className={cn(
            'h-24 w-24 flex items-center justify-center rounded-full transition-all duration-500',
            glow
          )}
        >
          <Flame className={cn('h-16 w-16 transition-colors duration-500', color)} />
        </motion.div>
        <p className="text-3xl font-bold">{streak} Days</p>
        <p className="text-xs text-muted-foreground h-8">{message}</p>
      </CardContent>
    </Card>
  );
}
