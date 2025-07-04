'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { handleCreatePlan } from './actions';
import { Loader2, Calendar as CalendarIcon, Sparkles, CalendarDays, Share2, BarChart2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';

const plannerSchema = z.object({
  subjects: z.string().min(3, 'Please enter at least one subject.'),
  examDate: z.date({
    required_error: 'An exam date is required.',
  }),
  weeklyStudyTime: z.coerce.number().min(1, 'Please enter at least 1 hour.'),
});

type PlannerFormValues = z.infer<typeof plannerSchema>;

export default function PlannerPage() {
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PlannerFormValues>({
    resolver: zodResolver(plannerSchema),
    defaultValues: {
      subjects: '',
      weeklyStudyTime: 10,
    },
  });

  const onSubmit = async (data: PlannerFormValues) => {
    setIsLoading(true);
    setResult(null);
    try {
      const planResult = await handleCreatePlan({
        ...data,
        examDate: format(data.examDate, 'yyyy-MM-dd'),
      });
      if (planResult) {
        setResult(planResult.studyPlan);
      } else {
        toast({
          variant: 'destructive',
          title: 'Planning Failed',
          description: 'An error occurred while creating your study plan. Please try again.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please check the console for details.',
      });
      console.error(error);
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="text-center mb-12">
        <CalendarDays className="mx-auto h-12 w-12 text-primary" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold mt-4">AI-Powered Study Planner</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Generate a personalized study schedule in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Enter Your Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="subjects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subjects</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Math, History, Biology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="examDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Exam Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weeklyStudyTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weekly Study Time (hours)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Plan...
                    </>
                  ) : (
                    'Generate Study Plan'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="sticky top-24">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Sparkles className="h-6 w-6 text-accent" /> Your Weekly Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[300px] prose-styles">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Building your personalized schedule...</p>
                </div>
              )}
              {result && (
                <div className="space-y-4 animate-in fade-in-50 duration-500">
                  <div dangerouslySetInnerHTML={{ __html: result }} />
                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline">
                          <CalendarIcon className="mr-2 h-4 w-4" /> Copy to Google Calendar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-accent" />
                            Unlock Google Calendar Sync!
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This is a premium feature. Upgrade to FocusFlow AI Premium to automatically sync your study plans with your Google Calendar and stay organized effortlessly.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Maybe Later</AlertDialogCancel>
                          <AlertDialogAction asChild>
                            <Link href="#">Go Premium</Link>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="ghost" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-headline text-md mb-2">What's Next?</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      You have a plan! Start tracking your sessions to stay on target.
                    </p>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/tracker">
                        <BarChart2 className="mr-2" /> Go to Progress Tracker
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
              {!isLoading && !result && (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                  <p>Your study plan will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
