'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface MasteryGraphProps {
  data: {
    date: string;
    [subject: string]: number | string;
  }[];
}

export function MasteryGraph({ data }: MasteryGraphProps) {
  const subjects = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'date') : [];

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
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Complete quizzes and exams to see your mastery.</p>
          </div>
        ) : (
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {subjects.map((subject, index) => (
                <Line key={subject} type="monotone" dataKey={subject} stroke={`hsl(var(--primary), ${1 - index * 0.2})`} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
