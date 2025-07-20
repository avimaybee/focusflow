'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

interface LearningVelocityProps {
  // Data props will be added later
}

export function LearningVelocity({}: LearningVelocityProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Learning Velocity</CardTitle>
        <Zap className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          Analytics on your learning speed are coming soon!
        </p>
      </CardContent>
    </Card>
  );
}
