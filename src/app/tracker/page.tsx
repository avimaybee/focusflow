'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, PlusCircle, Target, Loader2, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTrackerData, logStudySession, setOrUpdateGoal, TrackerData } from './actions';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

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
          Log your study hours, set goals, and start a focused study session.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">My Subjects</CardTitle>
                    <CardDescription>Your weekly progress for each subject. Start a study session from here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {data.length > 0 ? (
                        data.map(item => {
                            const progress = item.goal > 0 ? (item.logged / item.goal) * 100 : 0;
                            return (
                                <div key={item.subject} className="p-4 border rounded-lg flex flex-col sm:flex-row items-center gap-4">
                                    <div className="flex-grow w-full">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <p className="font-semibold">{item.subject}</p>
                                            <p className="text-sm text-muted-foreground">
                                                <span className="font-bold text-foreground">{Math.round(item.logged * 10) / 10}</span> / {item.goal} hrs
                                            </p>
                                        </div>
                                        <Progress value={progress} />
                                    </div>
                                    <Button asChild className="w-full sm:w-auto flex-shrink-0">
                                        <Link href={`/study-mode?subject=${encodeURIComponent(item.subject)}`}>
                                            <BookOpen /> Start Study Mode
                                        </Link>
                                    </Button>
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            <p>No subjects found.</p>
                            <p className="text-sm">Add a subject and a goal to get started.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="space-y-8 lg:sticky lg:top-24">
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
