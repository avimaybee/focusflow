'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart2, PlusCircle, Target } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialData = [
  { subject: 'Math', goal: 10, logged: 8 },
  { subject: 'History', goal: 8, logged: 6 },
  { subject: 'Biology', goal: 12, logged: 5 },
  { subject: 'English', goal: 6, logged: 6 },
  { subject: 'Chemistry', goal: 10, logged: 9 },
];

export default function TrackerPage() {
    const [data, setData] = useState(initialData);

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
      <div className="text-center mb-12">
        <BarChart2 className="mx-auto h-12 w-12 text-primary" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold mt-4">Progress Tracker</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Log your study hours and watch your progress grow.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className='font-headline'>Weekly Study Progress</CardTitle>
              <CardDescription>Goal vs. Logged Hours per Subject</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))"
                            }}
                        />
                        <Legend />
                        <Bar dataKey="goal" fill="hsl(var(--secondary))" name="Goal Hours" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="logged" fill="hsl(var(--primary))" name="Logged Hours" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className='font-headline flex items-center gap-2'>
                <PlusCircle className="h-6 w-6" /> Log a Study Session
              </CardTitle>
              <CardDescription>Add the hours you've studied.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject-select">Subject</Label>
                <Input id="subject-select" placeholder="Select a subject (e.g., Math)" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours-logged">Hours Logged</Label>
                <Input id="hours-logged" type="number" placeholder="e.g., 2" />
              </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full">Log Hours</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='font-headline flex items-center gap-2'>
                <Target className="h-6 w-6" /> Set Weekly Goals
              </CardTitle>
              <CardDescription>Update your target study hours.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="subject-goal">Subject</Label>
                    <Input id="subject-goal" placeholder="e.g., Chemistry" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="hours-goal">New Goal (Hours)</Label>
                    <Input id="hours-goal" type="number" placeholder="e.g., 12" />
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full">Set Goal</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
