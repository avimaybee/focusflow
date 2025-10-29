'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, MessageSquare, BookOpen, Award } from 'lucide-react';

export function WeeklySummaryCard() {
  // Mock data for preview
  const weeklyStats = [
    { label: 'Chats this week', value: 12, icon: MessageSquare, trend: '+3 from last week' },
    { label: 'Study sessions', value: 8, icon: BookOpen, trend: '+2 from last week' },
    { label: 'Goals completed', value: 5, icon: Award, trend: 'On track!' },
  ];

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Weekly Report</CardTitle>
            <CardDescription>Here&apos;s how you did this past week.</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Preview</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {weeklyStats.map((stat, index) => (
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
        <p className="mt-4 text-xs text-muted-foreground text-center">
          This is preview data. Real analytics coming soon!
        </p>
      </CardContent>
    </Card>
  );
}
