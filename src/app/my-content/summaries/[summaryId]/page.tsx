
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Share2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { makeSummaryPublic } from '@/lib/content-actions';
import { useToast } from '@/hooks/use-toast';
import { marked } from 'marked';

interface Summary {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  createdAt: Timestamp;
  isPublic?: boolean;
  publicSlug?: string;
}

export default function SummaryDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const summaryId = params.summaryId as string;
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user && summaryId) {
      const fetchSummary = async () => {
        setIsLoading(true);
        const docRef = doc(db, 'users', user.uid, 'summaries', summaryId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Summary;
          setSummary(data);
          const parsedHtml = await marked.parse(data.summary);
          setHtmlContent(parsedHtml);
        } else {
          setSummary(null);
        }
        setIsLoading(false);
      };

      fetchSummary();
    }
  }, [user, summaryId, authLoading, router]);

  const handleShare = async () => {
    if (!user || !summary) return;
    setIsSharing(true);
    try {
      const slug = await makeSummaryPublic(user.uid, summary.id);
      const publicUrl = `${window.location.origin}/summaries/${slug}`;
      setSummary(prev => prev ? { ...prev, isPublic: true, publicSlug: slug } : null);
      toast({
        title: "Summary Published!",
        description: `Your summary is now live at: ${publicUrl}`,
      });
      navigator.clipboard.writeText(publicUrl);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Sharing Failed',
        description: 'Could not make the summary public. Please try again.',
      });
    } finally {
      setIsSharing(false);
    }
  };


  if (isLoading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!summary) {
    notFound();
  }

  return (
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
                {summary.keywords && summary.keywords.map(keyword => (
                    <Badge key={keyword} variant="secondary">{keyword}</Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </CardContent>
          </Card>
           <div className="mt-4 flex gap-2">
            {summary.isPublic && summary.publicSlug ? (
              <Button asChild>
                <Link href={`/summaries/${summary.publicSlug}`} target="_blank">
                  View Public Page
                </Link>
              </Button>
            ) : (
              <Button onClick={handleShare} disabled={isSharing}>
                {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                Publish & Share
              </Button>
            )}
            <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4"/> Print</Button>
          </div>
        </div>
    </main>
  );
}
