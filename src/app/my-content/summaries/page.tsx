'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getSummaries, handleDeleteSummary, SavedSummary } from './actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Trash2, PlusCircle, AlertTriangle } from 'lucide-react';
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

export default function MySummariesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [summaries, setSummaries] = useState<SavedSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      getSummaries(user.uid)
        .then(setSummaries)
        .finally(() => setIsLoading(false));
    }
  }, [user, router]);
  
  const onDelete = async (summaryId: string) => {
    const result = await handleDeleteSummary(user!.uid, summaryId);
    if(result.success) {
      setSummaries(summaries.filter(s => s.id !== summaryId));
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
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
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
                <Button variant="outline" size="sm" disabled>View</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
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
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(summary.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
