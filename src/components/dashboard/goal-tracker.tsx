'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';

interface Goal {
  id: string;
  subject: string;
  targetHours: number;
  progressHours: number;
}

interface GoalTrackerProps {
  goals: Goal[];
  onSetGoal: () => void; // Function to open the goal setting modal
}

export function GoalTracker({ goals, onSetGoal }: GoalTrackerProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Weekly Goals</CardTitle>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Set weekly goals to stay on track.</p>
            <Button onClick={onSetGoal}>Set a Goal</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => (
              <div key={goal.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{goal.subject}</span>
                  <span className="text-sm text-muted-foreground">
                    {goal.progressHours.toFixed(1)} / {goal.targetHours} hrs
                  </span>
                </div>
                <Progress value={(goal.progressHours / goal.targetHours) * 100} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
