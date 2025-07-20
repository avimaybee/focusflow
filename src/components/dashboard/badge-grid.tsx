'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  name: string;
  description: string;
}

const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'created_first_summary', name: 'First Summary', description: 'Create your first summary.' },
  { id: 'completed_10_quizzes', name: 'Quiz Master', description: 'Complete 10 quizzes.' },
  { id: 'flashcard_pro', name: 'Flashcard Pro', description: 'Create 5 sets of flashcards.' },
  // Add more achievements here
];

interface BadgeGridProps {
  earnedAchievements: string[]; // Array of achievement IDs
}

export function BadgeGrid({ earnedAchievements }: BadgeGridProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Achievements</CardTitle>
        <Award className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="grid grid-cols-4 gap-4">
            {ALL_ACHIEVEMENTS.map(ach => {
              const isEarned = earnedAchievements.includes(ach.id);
              return (
                <Tooltip key={ach.id}>
                  <TooltipTrigger>
                    <div className={cn(
                      "p-2 border rounded-lg flex items-center justify-center",
                      isEarned ? 'bg-yellow-400/20 border-yellow-500' : 'bg-muted/50'
                    )}>
                      <Award className={cn("h-8 w-8", isEarned ? 'text-yellow-500' : 'text-muted-foreground')} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-bold">{ach.name}</p>
                    <p>{ach.description}</p>
                    {!isEarned && <p className="text-xs text-muted-foreground">(Locked)</p>}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
