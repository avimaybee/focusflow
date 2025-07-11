
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Loader2, Target, BookOpen, Plus, FileText, HelpCircle, BrainCircuit, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getWeek, startOfWeek, endOfWeek, format } from 'date-fns';
import { getDashboardStats } from '@/lib/dashboard-actions';

interface StudySession {
  id: string;
  subject: string;
  duration: number; // in minutes
  createdAt: Timestamp;
}

interface Goal {
  id: string;
  weeklyHours: number;
  updatedAt: Timestamp;
}

interface ChartData {
  name: string;
  logged: number;
  goal: number;
}

interface KpiStats {
    summariesCount: number;
    quizzesCount: number;
    flashcardSetsCount: number;
    studyPlansCount: number;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [kpiStats, setKpiStats] = useState<KpiStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState('');

  // Fetch KPI Stats
  useEffect(() => {
    if (user?.uid) {
        getDashboardStats(user.uid).then(stats => {
            setKpiStats(stats);
        });
    }
  }, [user?.uid]);

  // Fetch Goals
  useEffect(() => {
    if (!user?.uid) return;
    const goalsRef = collection(db, 'users', user.uid, 'goals');
    const q = query(goalsRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const goalDoc = snapshot.docs[0];
        setGoal({ id: goalDoc.id, ...goalDoc.data() } as Goal);
        setWeeklyGoal(String(goalDoc.data().weeklyHours || ''));
      } else {
        setGoal(null);
      }
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch Study Sessions for the current week
  useEffect(() => {
    if (!user?.uid) return;
    const now = new Date();
    const start = startOfWeek(now);
    const end = endOfWeek(now);

    const sessionsRef = collection(db, 'users', user.uid, 'studySessions');
    const q = query(
      sessionsRef,
      where('createdAt', '>=', start),
      where('createdAt', '<=', end)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const weeklySessions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as StudySession[];
      setSessions(weeklySessions);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Process data for the chart
  useEffect(() => {
    const dailyGoal = goal ? (goal.weeklyHours * 60) / 7 : 0;
    const newChartData = dayNames.map((day, index) => {
      const totalMinutes = sessions
        .filter((s) => s.createdAt.toDate().getDay() === index)
        .reduce((acc, curr) => acc + curr.duration, 0);
      return {
        name: day,
        logged: parseFloat((totalMinutes / 60).toFixed(2)),
        goal: parseFloat((dailyGoal / 60).toFixed(2)),
      };
    });
    setChartData(newChartData);
  }, [sessions, goal]);

  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject || !duration) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out all fields.' });
      return;
    }

    try {
      await addDoc(collection(db, 'users', user.uid, 'studySessions'), {
        subject,
        duration: Number(duration),
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Success!', description: 'Your study session has been logged.' });
      setSubject('');
      setDuration('');
      // Find the close button and click it
      document.getElementById('close-log-session')?.click();
    } catch (error) {
      console.error('Error logging session:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not log your session.' });
    }
  };

  const handleSetGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !weeklyGoal) {
        toast({ variant: 'destructive', title: 'Missing Field', description: 'Please set a weekly goal.' });
        return;
    }

    const newGoal = {
        weeklyHours: Number(weeklyGoal),
        updatedAt: serverTimestamp(),
    };

    try {
        if (goal) {
            // Update existing goal
            const goalRef = doc(db, 'users', user.uid, 'goals', goal.id);
            await updateDoc(goalRef, newGoal);
        } else {
            // Create new goal
            await addDoc(collection(db, 'users', user.uid, 'goals'), newGoal);
        }
        toast({ title: 'Success!', description: 'Your weekly goal has been set.' });
        document.getElementById('close-set-goal')?.click();
    } catch (error) {
        console.error('Error setting goal:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not set your goal.' });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalHoursLogged = sessions.reduce((acc, s) => acc + s.duration, 0) / 60;

  return (
    <>
      <Header />
      <main className="flex-grow bg-secondary/30">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>
          
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Summaries Made</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiStats?.summariesCount ?? <Loader2 className="h-5 w-5 animate-spin" />}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiStats?.quizzesCount ?? <Loader2 className="h-5 w-5 animate-spin" />}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Flashcard Sets</CardTitle>
                    <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiStats?.flashcardSetsCount ?? <Loader2 className="h-5 w-5 animate-spin" />}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Study Plans</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiStats?.studyPlansCount ?? <Loader2 className="h-5 w-5 animate-spin" />}</div>
                </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Weekly Progress</CardTitle>
                <CardDescription>
                  Your study hours for the week of {format(new Date(), 'MMMM do')}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] w-full">
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="goal" fill="hsl(var(--primary) / 0.3)" name="Goal (Daily Avg)" />
                    <Bar dataKey="logged" fill="hsl(var(--primary))" name="Logged" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Actions & Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Weekly Goal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {totalHoursLogged.toFixed(1)} /{' '}
                    <span className="text-muted-foreground">
                      {(goal?.weeklyHours || 0).toFixed(1)} hours
                    </span>
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary" className="w-full mt-4">
                        {goal ? 'Update Goal' : 'Set Goal'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Set Your Weekly Goal</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSetGoal}>
                        <div className="grid gap-4 py-4">
                          <Label htmlFor="weekly-goal">Weekly Study Hours</Label>
                          <Input
                            id="weekly-goal"
                            type="number"
                            value={weeklyGoal}
                            onChange={(e) => setWeeklyGoal(e.target.value)}
                            placeholder="e.g., 10"
                          />
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="secondary" id="close-set-goal">
                              Cancel
                            </Button>
                          </DialogClose>
                          <Button type="submit">Save Goal</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Log a Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Plus className="mr-2 h-4 w-4" /> Log New Session
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Log a New Study Session</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleLogSession}>
                        <div className="grid gap-4 py-4">
                          <div>
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                              id="subject"
                              value={subject}
                              onChange={(e) => setSubject(e.target.value)}
                              placeholder="e.g., History"
                            />
                          </div>
                          <div>
                            <Label htmlFor="duration">Duration (in minutes)</Label>
                            <Input
                              id="duration"
                              type="number"
                              value={duration}
                              onChange={(e) => setDuration(e.target.value)}
                              placeholder="e.g., 60"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                           <DialogClose asChild>
                            <Button type="button" variant="secondary" id="close-log-session">
                              Cancel
                            </Button>
                          </DialogClose>
                          <Button type="submit">Log Session</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
