
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Share2, Printer, Save, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { makeSummaryPublic, updateContent } from '@/lib/content-actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [renderedContent, setRenderedContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editMode, setEditMode] = useState(false);

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
          setTitle(data.title);
          setContent(data.summary);
          setRenderedContent(await marked.parse(data.summary));
        } else {
          setSummary(null);
        }
        setIsLoading(false);
      };

      fetchSummary();
    }
  }, [user, summaryId, authLoading, router]);
  
  const handleUpdate = async () => {
    if (!user || !summary || !hasChanges) {
        setEditMode(false);
        return;
    }
    setIsSaving(true);
    try {
      const contentToSave = { title, summary: content };
      await updateContent(user.uid, summary.id, 'summary', contentToSave);
      setRenderedContent(await marked.parse(content));
      toast({ title: 'Success!', description: 'Your summary has been updated.' });
      setHasChanges(false);
      setEditMode(false);
    } catch (error) {
       console.error(error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update the summary. Please try again.',
      });
    } finally {
        setIsSaving(false);
    }
  };

  const handleToggleEdit = () => {
    if (editMode && hasChanges) {
        handleUpdate();
    } else {
        setEditMode(!editMode);
    }
  };

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
      <div className="flex h-full w-full items-center justify-center">
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
          <div className="flex justify-between items-center mb-4">
              <Button variant="ghost" asChild>
                  <Link href="/my-content">← Back to My Content</Link>
              </Button>
              <div className="flex gap-2">
                <Button onClick={handleToggleEdit} disabled={isSaving}>
                    {editMode ? (
                        isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />
                    ) : (
                        <Pencil className="mr-2 h-4 w-4" />
                    )}
                    {editMode ? 'Save' : 'Edit'}
                </Button>
              </div>
          </div>
          <Card>
            <CardHeader>
              {editMode ? (
                <Input 
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setHasChanges(true); }}
                    className="text-3xl font-bold border-none focus-visible:ring-0 p-0"
                />
              ) : (
                <h1 className="text-3xl font-bold">{title}</h1>
              )}
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
              {editMode ? (
                <Textarea
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setHasChanges(true); }}
                    className="w-full h-auto min-h-[400px] border rounded-md p-2 bg-transparent text-base focus-visible:ring-1"
                />
              ) : (
                <div
                    className="prose-styles min-h-[400px]"
                    dangerouslySetInnerHTML={{ __html: renderedContent }}
                />
              )}
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
