'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart2, PlusCircle, Target, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const initialData = [
  { subject: 'Math', goal: 10, logged: 8 },
  { subject: 'History', goal: 8, logged: 6 },
  { subject: 'Biology', goal: 12, logged: 5 },
  { subject: 'English', goal: 6, logged: 6 },
  { subject: 'Chemistry', goal: 10, logged: 9 },
];

type SubjectData = {
    subject: string;
    goal: number;
    logged: number;
}

const logSessionSchema = z.object({
  subject: z.string().min(1, 'Please select a subject.'),
  hours: z.coerce.number().min(0.1, 'Please enter a valid number of hours.'),
});

const setGoalSchema = z.object({
  subject: z.string().min(2, 'Subject name must be at least 2 characters.').max(50),
  goal: z.coerce.number().min(1, 'Goal must be at least 1 hour.'),
});

type LogSessionFormValues = z.infer<typeof logSessionSchema>;
type SetGoalFormValues = z.infer<typeof setGoalSchema>;


export default function TrackerPage() {
    const [data, setData] = useState<SubjectData[]>(initialData);
    const { toast } = useToast();

    const logSessionForm = useForm<LogSessionFormValues>({
        resolver: zodResolver(logSessionSchema),
        defaultValues: {
            subject: '',
            hours: 1,
        }
    });

    const setGoalForm = useForm<SetGoalFormValues>({
        resolver: zodResolver(setGoalSchema),
        defaultValues: {
            subject: '',
            goal: 10,
        }
    });

    const handleLogSession = (values: LogSessionFormValues) => {
        setData(currentData =>
            currentData.map(item =>
                item.subject.toLowerCase() === values.subject.toLowerCase()
                    ? { ...item, logged: item.logged + values.hours }
                    : item
            )
        );
        toast({
            title: 'Session Logged!',
            description: `You've logged ${values.hours} hour(s) for ${values.subject}. Keep it up!`,
        });
        logSessionForm.reset({ subject: '', hours: 1 });
    };

    const handleSetGoal = (values: SetGoalFormValues) => {
        const subjectExists = data.some(d => d.subject.toLowerCase() === values.subject.toLowerCase());

        if (subjectExists) {
            setData(currentData =>
                currentData.map(item =>
                    item.subject.toLowerCase() === values.subject.toLowerCase()
                        ? { ...item, goal: values.goal }
                        : item
                )
            );
            toast({
                title: 'Goal Updated!',
                description: `Your weekly goal for ${values.subject} is now ${values.goal} hours.`,
            });
        } else {
            setData(currentData => [
                ...currentData,
                { subject: values.subject, goal: values.goal, logged: 0 }
            ]);
            toast({
                title: 'Subject Added!',
                description: `${values.subject} has been added to your tracker with a goal of ${values.goal} hours.`,
            });
        }
        setGoalForm.reset({ subject: '', goal: 10 });
    };


  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
      <div className="text-center mb-12">
        <BarChart2 className="mx-auto h-12 w-12 text-primary" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold mt-4">Progress Tracker</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Log your study hours and watch your progress grow.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className='font-headline'>Weekly Study Progress</CardTitle>
              <CardDescription>Goal vs. Logged Hours per Subject</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)"
                            }}
                        />
                        <Legend wrapperStyle={{fontSize: "14px"}} />
                        <Bar dataKey="goal" fill="hsl(var(--accent))" name="Goal Hours" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="logged" fill="hsl(var(--primary))" name="Logged Hours" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
            <Card>
                <Form {...logSessionForm}>
                    <form onSubmit={logSessionForm.handleSubmit(handleLogSession)}>
                        <CardHeader>
                        <CardTitle className='font-headline flex items-center gap-2'>
                            <PlusCircle className="h-6 w-6" /> Log a Study Session
                        </CardTitle>
                        <CardDescription>Add the hours you've studied for an existing subject.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        <FormField
                            control={logSessionForm.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a subject" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {data.map(item => (
                                            <SelectItem key={item.subject} value={item.subject}>
                                                {item.subject}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={logSessionForm.control}
                            name="hours"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Hours Logged</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.5" placeholder="e.g., 2" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={logSessionForm.formState.isSubmitting}>
                                {logSessionForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Log Hours
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>

            <Card>
                <Form {...setGoalForm}>
                    <form onSubmit={setGoalForm.handleSubmit(handleSetGoal)}>
                        <CardHeader>
                            <CardTitle className='font-headline flex items-center gap-2'>
                                <Target className="h-6 w-6" /> Set Weekly Goals
                            </CardTitle>
                            <CardDescription>Update goals or add a new subject to track.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={setGoalForm.control}
                                name="subject"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Subject</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Physics" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                            <FormField
                                control={setGoalForm.control}
                                name="goal"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Goal (Hours)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g., 12" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={setGoalForm.formState.isSubmitting}>
                                {setGoalForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Set Goal
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
      </div>
    </div>
  );
}
