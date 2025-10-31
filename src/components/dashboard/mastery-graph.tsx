'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { getTopicMastery } from '@/lib/analytics-actions';
import { useAuth } from '@/context/auth-context';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(220, 90%, 56%)',
  'hsl(280, 90%, 56%)',
  'hsl(160, 90%, 46%)',
  'hsl(30, 90%, 56%)',
];

export function MasteryGraph() {
  const { user } = useAuth();
  const [data, setData] = useState<{ date: string; [subject: string]: number | string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMastery() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const masteryData = await getTopicMastery(user.id);
        setData(masteryData);
      } catch (error) {
        console.error('Error fetching topic mastery:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMastery();
  }, [user]);

  const subjects = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'date') : [];

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Topic Mastery Over Time
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          <div className="flex items-center justify-center h-full">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Topic Mastery Over Time
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] w-full">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-sm mb-2">No Mastery Data Yet</h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Complete quizzes and practice exams to track your topic mastery over time. Your progress will be visualized here.
            </p>
          </div>
        ) : (
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} label={{ value: 'Mastery %', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {subjects.map((subject, index) => (
                <Line 
                  key={subject} 
                  type="monotone" 
                  dataKey={subject} 
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
