'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getSummaries, handleDeleteSummary, SavedSummary, makeSummaryPublic } from './actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Trash2, PlusCircle, AlertTriangle, Share2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
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
import { formatDistanceToNow } from 'date-fns';

type SummaryActionState = {
  isDeleting: boolean;
  isSharing: boolean;
  summaryId: string | null;
  showShareModal: boolean;
  showDeleteModal: boolean;
};

export default function MySummariesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [summaries, setSummaries] = useState<SavedSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionState, setActionState] = useState<SummaryActionState>({
    isDeleting: false,
    isSharing: false,
    summaryId: null,
    showShareModal: false,
    showDeleteModal: false,
  });
  
  const [newPublicLink, setNewPublicLink] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      getSummaries(user.uid)
        .then(setSummaries)
        .finally(() => setIsLoading(false));
    }
  }, [user, router]);
  
  const onDelete = async () => {
    if (!actionState.summaryId || !user) return;
    setActionState(prev => ({...prev, isDeleting: true}));
    const result = await handleDeleteSummary(user.uid, actionState.summaryId);
    if(result.success) {
      setSummaries(summaries.filter(s => s.id !== actionState.summaryId));
      toast({
        title: "Summary Deleted",
        description: "The summary has been successfully deleted.",
      })
    } else {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Could not delete the summary. Please try again.",
      })
    }
    setActionState({ isDeleting: false, isSharing: false, summaryId: null, showShareModal: false, showDeleteModal: false });
  }

  const onShare = async () => {
    if (!actionState.summaryId || !user) return;
    setActionState(prev => ({...prev, isSharing: true}));
    setNewPublicLink('');

    const result = await makeSummaryPublic(user.uid, actionState.summaryId);
    if(result.success && result.slug) {
      // Update local state to reflect the change
      setSummaries(summaries.map(s => s.id === actionState.summaryId ? {...s, isPublic: true, publicSlug: result.slug} : s));
      const fullUrl = `${window.location.origin}/summaries/${result.slug}`;
      setNewPublicLink(fullUrl);
      toast({
        title: "Summary Published!",
        description: "Your summary is now public and discoverable.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Sharing Failed",
        description: result.error || "Could not share the summary. Please try again.",
      })
    }
     setActionState(prev => ({...prev, isSharing: false, showShareModal: false }));
  }

  const copyLink = () => {
    navigator.clipboard.writeText(newPublicLink);
    toast({ title: 'Link Copied!' });
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={actionState.showDeleteModal} onOpenChange={(open) => setActionState(prev => ({ ...prev, showDeleteModal: open, summaryId: open ? prev.summaryId : null }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your summary.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionState.isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} disabled={actionState.isDeleting}>
              {actionState.isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={actionState.showShareModal} onOpenChange={(open) => {
          if (!open) setNewPublicLink(''); // Reset link when closing
          setActionState(prev => ({...prev, showShareModal: open, summaryId: open ? prev.summaryId : null}));
       }}>
        <AlertDialogContent>
            {newPublicLink ? (
                 <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        Summary Published!
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Your summary is now public. Here is your shareable link:
                    </AlertDialogDescription>
                    <div className="flex items-center space-x-2 pt-2">
                        <Input value={newPublicLink} readOnly />
                        <Button onClick={copyLink} size="sm"><LinkIcon className="mr-2 h-4 w-4" /> Copy</Button>
                    </div>
                 </AlertDialogHeader>
            ) : (
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2"><Share2/> Make Summary Public?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will make your summary accessible to anyone with the link and discoverable by search engines. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
            )}
            <AlertDialogFooter>
              {newPublicLink ? (
                <AlertDialogCancel>Close</AlertDialogCancel>
              ) : (
                <>
                  <AlertDialogCancel disabled={actionState.isSharing}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onShare} disabled={actionState.isSharing}>
                     {actionState.isSharing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm & Publish
                  </AlertDialogAction>
                </>
              )}
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto max-w-5xl py-12 px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-headline text-3xl font-bold">My Summaries</h1>
              <p className="text-muted-foreground">View and manage your saved summaries.</p>
            </div>
          </div>
          <Button asChild>
            <Link href="/summarizer">
              <PlusCircle /> Create New Summary
            </Link>
          </Button>
        </div>

        {summaries.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-20 text-center">
            <CardHeader>
              <div className="mx-auto bg-muted p-4 rounded-full w-fit">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <CardTitle className="mt-4 font-headline">No Summaries Found</CardTitle>
              <CardDescription>You haven't saved any summaries yet.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/summarizer">Generate Your First Summary</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summaries.map(summary => (
              <Card key={summary.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="font-headline text-xl line-clamp-2">{summary.title}</CardTitle>
                  <CardDescription>
                    Saved {formatDistanceToNow(new Date(summary.createdAt), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <p className="text-muted-foreground line-clamp-4">{summary.summary}</p>
                  <div className="flex flex-wrap gap-2">
                      {summary.keywords.slice(0, 4).map(keyword => <Badge key={keyword} variant="secondary">{keyword}</Badge>)}
                  </div>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                  {summary.isPublic && summary.publicSlug ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/summaries/${summary.publicSlug}`} target="_blank"><ExternalLink className="mr-2 h-4 w-4" /> View Public</Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setActionState(prev => ({ ...prev, showShareModal: true, summaryId: summary.id }))}>
                      <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={() => setActionState(prev => ({...prev, showDeleteModal: true, summaryId: summary.id}))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
