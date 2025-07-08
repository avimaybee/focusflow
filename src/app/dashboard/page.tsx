

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BookCopy,
  CalendarDays,
  Check,
  CheckCircle,
  ClipboardCheck,
  FileText,
  Flame,
  Loader2,
  Target,
  Lightbulb,
  BrainCircuit,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getDashboardStats, DashboardStats } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const quickLinks = [
  { title: 'My Summaries', href: '/my-content/summaries', icon: <FileText className="h-8 w-8" /> },
  {
    title: 'My Study Plans',
    href: '/my-content/plans',
    icon: <CalendarDays className="h-8 w-8" />,
  },
  {
    title: 'My Flashcards',
    href: '/my-content/flashcards',
    icon: <BookCopy className="h-8 w-8" />,
  },
  {
    title: 'My Quizzes',
    href: '/my-content/quizzes',
    icon: <ClipboardCheck className="h-8 w-8" />,
  },
  {
    title: 'My Explanations',
    href: '/my-content/explanations',
    icon: <Lightbulb className="h-8 w-8" />,
  },
  {
    title: 'Memory Aids',
    href: '/memory-aids',
    icon: <BrainCircuit className="h-8 w-8" />,
  },
];

const achievements = [
    { title: '5-Day Streak', icon: Flame, unlocked: true },
    { title: 'Perfect Score', icon: CheckCircle, unlocked: true },
    { title: 'Planner Pro', icon: CalendarDays, unlocked: true },
    { title: 'Summarizer Sage', icon: FileText, unlocked: false },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    async function fetchStats() {
      setIsLoading(true);
      const data = await getDashboardStats(user.uid);
      setStats(data);
      setIsLoading(false);
    }
    
    fetchStats();
  }, [user, router]);


  if (!user && !isLoading) {
    return null;
  }
  
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const displayAvatar = user?.photoURL || `https://placehold.co/100x100.png`;
  const displayFallback = displayName?.charAt(0).toUpperCase() || 'U';
  
  const streakIsActive = (stats?.studyStreak ?? 0) > 0;
  
  const activityStats = [
    {
      title: 'Hours Studied',
      value: stats?.hoursStudied ?? 0,
      suffix: '',
      description: 'in the last 7 days',
      icon: <Target className="h-6 w-6 text-primary" />,
    },
    {
      title: 'Summaries Made',
      value: stats?.summariesMade ?? 0,
      suffix: '',
      description: 'in the last 7 days',
      icon: <FileText className="h-6 w-6 text-primary" />,
    },
    {
      title: 'Quizzes Taken',
      value: stats?.quizzesTaken ?? 0,
      suffix: '',
      description: 'in the last 7 days',
      icon: <ClipboardCheck className="h-6 w-6 text-primary" />,
    },
    {
      title: 'Study Streak',
      value: stats?.studyStreak ?? 0,
      suffix: ' days',
      description: 'consecutive study days',
      icon: <Flame className={cn("h-6 w-6 text-primary", streakIsActive && "text-accent animate-pulse")} />,
    },
  ];

  let snapshotSummary = "Here's a snapshot of your progress. Keep up the great work!";
  if (stats && !isLoading) {
    const hours = stats.hoursStudied;
    const streak = stats.studyStreak;
    const mainSubject = stats.weeklyActivity.length > 0 ? [...stats.weeklyActivity].sort((a, b) => b.logged - a.logged)[0].subject : null;

    let summaryParts = [];
    if (hours > 0) {
      summaryParts.push(`You've studied ${hours} ${hours === 1 ? 'hour' : 'hours'} this week`);
      if (mainSubject) {
          summaryParts.push(`primarily focusing on ${mainSubject}.`);
      } else {
          summaryParts.push('.');
      }
    } else {
        summaryParts.push("Ready to start studying this week?");
    }

    if (streak > 0) {
        summaryParts.push(`Your ${streak}-day study streak is going strong!`);
    } else if (hours > 0) {
        summaryParts.push("Let's build up a new study streak.");
    }
    snapshotSummary = summaryParts.join(' ');
  }

  const getRecommendation = () => {
    if (!stats || isLoading) return null;

    if (stats.weeklyActivity.length === 0) {
        return {
            text: "Welcome! Add your subjects and weekly goals in the tracker to get started.",
            link: "/tracker",
            linkText: "Go to Tracker",
            icon: <Target className="h-5 w-5 text-accent"/>
        };
    }

    const subjectToStudy = stats.weeklyActivity.find(s => s.goal > 0 && s.logged < s.goal);

    if (stats.hoursStudied === 0) {
        return {
            text: "It's a new week! Let's get started by creating a fresh study plan.",
            link: "/planner",
            linkText: "Create Study Plan",
            icon: <CalendarDays className="h-5 w-5 text-accent"/>
        };
    }
    
    if (subjectToStudy) {
         return {
            text: `You're making progress towards your goal in ${subjectToStudy.subject}. Ready for a focused session?`,
            link: `/study-mode?subject=${encodeURIComponent(subjectToStudy.subject)}`,
            linkText: "Start Study Mode",
            icon: <BookOpen className="h-5 w-5 text-accent"/>
        };
    }

    if (stats.studyStreak === 0 && stats.hoursStudied > 0) {
        return {
            text: "You're off to a great start! Log another session tomorrow to build your study streak.",
            link: "/tracker",
            linkText: "Log Session",
            icon: <Flame className="h-5 w-5 text-accent"/>
        };
    }

    if (stats.quizzesTaken < stats.summariesMade) {
        return {
            text: "You've been creating summaries. Time to test your knowledge with a practice quiz!",
            link: "/quiz",
            linkText: "Create a Quiz",
            icon: <ClipboardCheck className="h-5 w-5 text-accent"/>
        };
    }

    return {
        text: "You're on a roll! Why not solidify your knowledge by creating some flashcards?",
        link: "/flashcards",
        linkText: "Create Flashcards",
        icon: <BookCopy className="h-5 w-5 text-accent"/>
    };
  };

  const recommendation = getRecommendation();

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={displayAvatar} alt={displayName} data-ai-hint="person" />
            <AvatarFallback>{displayFallback}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-headline text-3xl font-bold">
              Welcome Back, {displayName}!
            </h1>
            <p className="text-muted-foreground max-w-2xl mt-1">
              {isLoading ? <Skeleton className="h-5 w-3/4" /> : snapshotSummary}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/planner">Create New Study Plan</Link>
        </Button>
      </div>

      {recommendation && !isLoading && (
        <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-grow">
                    <div className="hidden sm:block">{recommendation.icon}</div>
                    <div>
                        <p className="font-headline text-md font-semibold text-primary/90">Recommended Next Step</p>
                        <p className="text-sm text-muted-foreground">{recommendation.text}</p>
                    </div>
                </div>
                <Button asChild variant="secondary" size="sm" className="sm:ml-auto w-full sm:w-auto">
                    <Link href={recommendation.link}>{recommendation.linkText}</Link>
                </Button>
            </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {activityStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-1/2" />
              ) : (
                <div className="text-4xl font-bold">{stat.value}{stat.suffix}</div>
              )}
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Weekly Activity</CardTitle>
            <CardDescription>Hours you've logged this week vs your goal.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.weeklyActivity}
                    margin={{
                      top: 5,
                      right: 20,
                      left: -10,
                      bottom: 5,
                    }}
                  >
                    <XAxis
                      dataKey="subject"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: 'Hours', angle: -90, position: 'insideLeft', offset: 10, style: { fill: 'hsl(var(--muted-foreground))' } }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                      }}
                      cursor={{ fill: 'hsl(var(--muted))' }}
                    />
                    <Bar
                      dataKey="logged"
                      fill="hsl(var(--primary))"
                      name="Logged Hours"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">My Content</CardTitle>
              <CardDescription>
                Quickly access your saved materials.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              {quickLinks.map((link) => (
                <Button
                  key={link.title}
                  variant="outline"
                  className="h-24 flex flex-col gap-2 p-2 text-center"
                  asChild
                >
                  <Link href={link.href}>
                    {link.icon}
                    <span className="text-xs font-medium leading-tight">{link.title}</span>
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Achievements</CardTitle>
              <CardDescription>Badges you've earned.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="flex flex-wrap items-start justify-center gap-x-4 gap-y-6">
                  {achievements.map((ach) => {
                    const Icon = ach.icon;
                    return (
                      <Tooltip key={ach.title}>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-2 w-24 cursor-pointer text-center">
                            <div className={cn(
                              "relative flex h-20 w-20 items-center justify-center rounded-full bg-muted transition-all duration-300",
                              ach.unlocked 
                                ? 'bg-accent/20 border-2 border-accent shadow-lg' 
                                : 'opacity-50 grayscale'
                            )}>
                              <Icon className={cn(
                                "h-8 w-8",
                                ach.unlocked ? 'text-accent' : 'text-muted-foreground'
                              )} />
                              {ach.unlocked && (
                                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary border-2 border-background">
                                  <Check className="h-4 w-4 text-primary-foreground" />
                                </div>
                              )}
                            </div>
                            <p className={cn(
                              "text-xs font-semibold text-balance",
                              ach.unlocked ? 'text-foreground' : 'text-muted-foreground'
                            )}>
                              {ach.title}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{ach.unlocked ? `Unlocked: ${ach.title}` : `Locked: ${ach.title}`}</p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
