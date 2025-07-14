
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDocs,
  where,
  orderBy,
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
import { Loader2, Target, BookOpen, Plus, FileText, HelpCircle, BrainCircuit, Calendar, Flame, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { startOfWeek, endOfWeek, format, eachDayOfInterval } from 'date-fns';
import { getDashboardStats } from '@/lib/dashboard-actions';
import AnimatedNumberCountdown from '@/components/ui/animated-number-countdown';
import Link from 'next/link';

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

const badges = [
    { id: 'summarizer_1', title: 'First Summary', description: 'Create your first summary', icon: FileText, check: (stats: KpiStats) => stats.summariesCount > 0 },
    { id: 'summarizer_5', title: 'Super Summarizer', description: 'Create 5 summaries', icon: FileText, check: (stats: KpiStats) => stats.summariesCount >= 5 },
    { id: 'quizzer_1', title: 'Quiz Whiz', description: 'Take your first quiz', icon: HelpCircle, check: (stats: KpiStats) => stats.quizzesCount > 0 },
    { id: 'quizzer_5', title: 'Quiz Master', description: 'Take 5 quizzes', icon: HelpCircle, check: (stats: KpiStats) => stats.quizzesCount >= 5 },
    { id: 'flashcard_1', title: 'Flashcard Fan', description: 'Create a flashcard set', icon: BrainCircuit, check: (stats: KpiStats) => stats.flashcardSetsCount > 0 },
    { id: 'planner_1', title: 'Planner Pro', description: 'Create a study plan', icon: Calendar, check: (stats: KpiStats) => stats.studyPlansCount > 0 },
    { id: 'streak_3', title: 'On Fire!', description: 'Achieve a 3-day streak', icon: Flame, check: (_: KpiStats, streak: number) => streak >= 3 },
    { id: 'streak_7', title: 'Week-Long Warrior', description: 'Achieve a 7-day streak', icon: Flame, check: (_: KpiStats, streak: number) => streak >= 7 },
];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [kpiStats, setKpiStats] = useState<KpiStats | null>(null);
  const [studyStreak, setStudyStreak] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<typeof badges>([]);
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
        }).catch(err => console.error("Failed to fetch dashboard stats", err));
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

  // Fetch all study sessions for streak calculation
  // And weekly sessions for chart
  useEffect(() => {
    if (!user?.uid) return;
    setIsLoading(true);
    const sessionsRef = collection(db, 'users', user.uid, 'studySessions');
    const q = query(sessionsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allSessions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as StudySession[];
      
      // Calculate streak with all sessions
      const sessionDates = allSessions.map(s => s.createdAt.toDate());
      const uniqueDays = new Set(sessionDates.map(d => d.toISOString().split('T')[0]));
      
      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      // Check for session today or yesterday to start counting
      if (uniqueDays.has(currentDate.toISOString().split('T')[0])) {
          streak++;
      } else {
        currentDate.setDate(currentDate.getDate() - 1);
        if (uniqueDays.has(currentDate.toISOString().split('T')[0])) {
          streak++;
        }
      }
      
      if(streak > 0) {
        while (true) {
            const prevDay = new Date(currentDate);
            prevDay.setDate(currentDate.getDate() - 1);
            const prevDayStr = prevDay.toISOString().split('T')[0];
            if (uniqueDays.has(prevDayStr)) {
                streak++;
                currentDate = prevDay;
            } else {
                break;
            }
        }
      }
      setStudyStreak(streak);

      // Filter for current week for chart
      const now = new Date();
      const start = startOfWeek(now);
      const end = endOfWeek(now);
      const weeklySessions = allSessions.filter(s => {
          const sessionDate = s.createdAt.toDate();
          return sessionDate >= start && sessionDate <= end;
      });
      setSessions(weeklySessions);

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Process data for the chart
  useEffect(() => {
    const dailyGoal = goal ? (goal.weeklyHours * 60) / 7 : 0;
    const now = new Date();
    const start = startOfWeek(now);
    const end = endOfWeek(now);
    const weekDays = eachDayOfInterval({ start, end });

    const newChartData = weekDays.map((day, index) => {
      const totalMinutes = sessions
        .filter((s) => s.createdAt.toDate().getDay() === day.getDay())
        .reduce((acc, curr) => acc + curr.duration, 0);
      return {
        name: dayNames[day.getDay()],
        logged: parseFloat((totalMinutes / 60).toFixed(2)),
        goal: parseFloat((dailyGoal / 60).toFixed(2)),
      };
    });
    setChartData(newChartData);
  }, [sessions, goal]);

  // Check for earned badges
  useEffect(() => {
    if (kpiStats) {
        const newEarnedBadges = badges.filter(badge => badge.check(kpiStats, studyStreak));
        setEarnedBadges(newEarnedBadges);
    }
  }, [kpiStats, studyStreak]);

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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                    <Flame className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">🔥 {studyStreak} Days</div>
                </CardContent>
            </Card>
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
              <Card className="bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-secondary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Premium Trial Ends Soon
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <p className="text-muted-foreground mb-4">Upgrade now to keep access to all premium features.</p>
                  <AnimatedNumberCountdown endDate={new Date("2025-12-31T23:59:59")} />
                  <Link href="/premium" className="w-full">
                    <Button className="w-full mt-4 premium-gradient">
                      Upgrade Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
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

          {/* Badges Section */}
          <Card className="mt-6">
            <CardHeader>
                <CardTitle>My Badges</CardTitle>
                <CardDescription>Achievements you've unlocked on your study journey.</CardDescription>
            </CardHeader>
            <CardContent>
                {earnedBadges.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {badges.map(badge => (
                            <div key={badge.id} className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-secondary/50 transition-all"
                                style={{ opacity: earnedBadges.some(b => b.id === badge.id) ? 1 : 0.3 }}
                            >
                                <badge.icon className="h-10 w-10 text-primary" />
                                <p className="font-semibold text-sm">{badge.title}</p>
                                <p className="text-xs text-muted-foreground">{badge.description}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">
                        You haven't earned any badges yet. Keep studying to unlock them!
                    </p>
                )}
            </CardContent>
          </Card>

        </div>
      </main>
      <Footer />
    </>
  );
}
