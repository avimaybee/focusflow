
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { useParams, notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Share2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface Summary {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  createdAt: Timestamp;
}

export default function SummaryDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const summaryId = params.summaryId as string;
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !summaryId) {
        if (!authLoading) setIsLoading(false);
        return;
    };

    const fetchSummary = async () => {
      const docRef = doc(db, 'users', user.uid, 'summaries', summaryId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setSummary({ id: docSnap.id, ...docSnap.data() } as Summary);
      }
      setIsLoading(false);
    };

    fetchSummary();
  }, [user, summaryId, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!summary && !isLoading) {
    notFound();
  }
  
  if (!summary) return null;

  return (
    <>
      <main className="flex-grow bg-secondary/30">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Button variant="ghost" asChild className="mb-4">
              <Link href="/my-content">← Back to My Content</Link>
          </Button>
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold">{summary.title}</CardTitle>
              <CardDescription>
                Created on {format(summary.createdAt.toDate(), 'MMMM dd, yyyy')}
              </CardDescription>
              <div className="flex gap-2 pt-2">
                {summary.keywords.map(keyword => (
                    <Badge key={keyword} variant="secondary">{keyword}</Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <p>{summary.summary}</p>
              </div>
            </CardContent>
          </Card>
           <div className="mt-4 flex gap-2">
            <Button><Share2 className="mr-2 h-4 w-4"/> Share</Button>
            <Button variant="outline"><Printer className="mr-2 h-4 w-4"/> Print</Button>
          </div>
        </div>
      </main>
    </>
  );
}
