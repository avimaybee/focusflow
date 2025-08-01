
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Summary {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  createdAt: Timestamp;
}

export default function MySummariesPage() {
  const { user, loading: authLoading } = useAuth();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      const summariesRef = collection(db, 'users', user.uid, 'summaries');
      const q = query(summariesRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userSummaries = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Summary[];
        setSummaries(userSummaries);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching summaries:", error);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">My Summaries</h1>
            <Button asChild>
                <Link href="/chat">Create New Summary</Link>
            </Button>
        </div>

        {summaries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summaries.map((summary) => (
              <Card key={summary.id}>
                <CardHeader>
                  <CardTitle className="truncate">{summary.title}</CardTitle>
                  <CardDescription>
                    Created {formatDistanceToNow(summary.createdAt.toDate(), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm text-muted-foreground mb-4">
                    {summary.summary}
                  </p>
                  <Button variant="secondary" className="w-full">
                    View Summary
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-border rounded-lg">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Summaries Yet</h2>
            <p className="text-muted-foreground mb-4">
              It looks like you haven't created any summaries.
            </p>
            <Button asChild>
              <Link href="/chat">Generate Your First Summary</Link>
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
