
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { ArrowRight, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <div className="flex-grow container mx-auto max-w-4xl py-12 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          Welcome Back, {displayName}!
        </h1>
        <p className="text-muted-foreground">
          Ready to dive back in? Your AI study partner is just a message away.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Start a Conversation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            You can summarize notes, generate quizzes, create study plans, and more, all from the chat.
          </p>
          <Button asChild>
            <Link href="/chat">
              Go to Chat <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
