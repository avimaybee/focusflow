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
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
  BookCopy,
  CalendarDays,
  CheckCircle,
  ClipboardCheck,
  FileText,
  Flame,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const user = {
  name: 'Alex Johnson',
  avatar: 'https://placehold.co/100x100.png',
};

const activityStats = [
  {
    title: 'Hours Studied',
    value: '12',
    icon: <Target className="h-6 w-6 text-primary" />,
  },
  {
    title: 'Summaries Made',
    value: '5',
    icon: <FileText className="h-6 w-6 text-primary" />,
  },
  {
    title: 'Quizzes Taken',
    value: '3',
    icon: <ClipboardCheck className="h-6 w-6 text-primary" />,
  },
];

const chartData = [
  { subject: 'Math', logged: 8 },
  { subject: 'History', logged: 6 },
  { subject: 'Biology', logged: 5 },
  { subject: 'English', logged: 6 },
];

const quickLinks = [
  { title: 'My Summaries', href: '#', icon: <FileText className="h-8 w-8" /> },
  {
    title: 'My Study Plans',
    href: '#',
    icon: <CalendarDays className="h-8 w-8" />,
  },
  {
    title: 'My Flashcards',
    href: '#',
    icon: <BookCopy className="h-8 w-8" />,
  },
  {
    title: 'My Quizzes',
    href: '#',
    icon: <ClipboardCheck className="h-8 w-8" />,
  },
];

const achievements = [
    { title: '5-Day Streak', icon: Flame, unlocked: true },
    { title: 'Perfect Score', icon: CheckCircle, unlocked: true },
    { title: 'Planner Pro', icon: CalendarDays, unlocked: true },
    { title: 'Summarizer Sage', icon: FileText, unlocked: false },
];

export default function DashboardPage() {
  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person" />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-headline text-3xl font-bold">
              Welcome Back, {user.name}!
            </h1>
            <p className="text-muted-foreground">
              Here's a snapshot of your progress. Keep up the great work!
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/planner">Create New Study Plan</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activityStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">in the last 7 days</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Weekly Activity</CardTitle>
            <CardDescription>Hours you've logged this week.</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
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
                  />
                  <Tooltip
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
            <CardContent className="grid grid-cols-2 gap-4">
              {quickLinks.map((link) => (
                <Button
                  key={link.title}
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  asChild
                >
                  <Link href={link.href}>
                    {link.icon}
                    <span className="text-sm font-medium">{link.title}</span>
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
            <CardContent className="flex flex-wrap gap-4">
              {achievements.map((ach) => {
                const Icon = ach.icon;
                return (
                    <div key={ach.title} className="flex flex-col items-center gap-2" title={ach.unlocked ? `Unlocked: ${ach.title}` : `Locked: ${ach.title}`}>
                        <div className={`relative rounded-full bg-muted p-4 ${!ach.unlocked && 'opacity-30'}`}>
                            <Icon className={`h-5 w-5 ${ach.unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <Badge variant={ach.unlocked ? 'secondary' : 'outline'}>{ach.title}</Badge>
                    </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
