'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart2, PlusCircle, Target, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTrackerData, logStudySession, setOrUpdateGoal, TrackerData } from './actions';


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
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [data, setData] = useState<TrackerData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const logSessionForm = useForm<LogSessionFormValues>({
        resolver: zodResolver(logSessionSchema),
        defaultValues: { subject: '', hours: 1 }
    });

    const setGoalForm = useForm<SetGoalFormValues>({
        resolver: zodResolver(setGoalSchema),
        defaultValues: { subject: '', goal: 10 }
    });
    
    const fetchTrackerData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const trackerData = await getTrackerData(user.uid);
            setData(trackerData);
        } catch (error) {
            console.error("Failed to fetch tracker data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load your tracker data.' });
        }
        setIsLoading(false);
    }, [user, toast]);
    
    useEffect(() => {
        if (!user) {
            router.push('/login');
        } else {
            fetchTrackerData();
        }
    }, [user, router, fetchTrackerData]);

    const handleLogSession = async (values: LogSessionFormValues) => {
        if (!user) return;
        try {
            await logStudySession(user.uid, values);
            toast({
                title: 'Session Logged!',
                description: `You've logged ${values.hours} hour(s) for ${values.subject}. Keep it up!`,
            });
            logSessionForm.reset({ subject: '', hours: 1 });
            await fetchTrackerData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not log your session.' });
        }
    };

    const handleSetGoal = async (values: SetGoalFormValues) => {
        if (!user) return;
        try {
            await setOrUpdateGoal(user.uid, values);
            const subjectExists = data.some(d => d.subject.toLowerCase() === values.subject.toLowerCase());
            toast({
                title: subjectExists ? 'Goal Updated!' : 'Subject Added!',
                description: `Your goal for ${values.subject} has been set to ${values.goal} hours.`,
            });
            setGoalForm.reset({ subject: '', goal: 10 });
            await fetchTrackerData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not set your goal.' });
        }
    };
    
    if (isLoading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

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
                 {data.length > 0 ? (
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
                 ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                        <p>No goals set yet.</p>
                        <p className="text-sm">Add a subject and a goal to start tracking!</p>
                    </div>
                 )}
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
                                <Select onValueChange={field.onChange} value={field.value} disabled={data.length === 0}>
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
