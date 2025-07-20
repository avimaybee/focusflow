'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart } from 'lucide-react';

export function WeeklySummaryCard() {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Your Weekly Report</CardTitle>
        <CardDescription>Here's how you did this past week.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary data will be populated here */}
        <p className="text-muted-foreground">Weekly summary data is coming soon!</p>
      </CardContent>
    </Card>
  );
}
