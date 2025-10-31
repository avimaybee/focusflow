'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { BrainCircuit } from 'lucide-react';

interface SubjectPieChartProps {
  studyTime: { [subject: string]: number };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function SubjectPieChart({ studyTime }: SubjectPieChartProps) {
  const data = Object.entries(studyTime).map(([name, value]) => ({ name, value }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Subject Breakdown</CardTitle>
        <BrainCircuit className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <div className="rounded-full bg-primary/10 p-3 mb-3">
              <BrainCircuit className="h-6 w-6 text-primary" />
            </div>
            <p className="font-semibold text-sm mb-1">No Study Data Yet</p>
            <p className="text-xs text-muted-foreground">
              Your subject breakdown will appear as you use the chat and create study materials.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
