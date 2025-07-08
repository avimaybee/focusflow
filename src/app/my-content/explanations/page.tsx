'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getSavedExplanations, handleDeleteExplanation, SavedExplanation } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb, Trash2, AlertTriangle, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';

export default function MyExplanationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [explanations, setExplanations] = useState<SavedExplanation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      getSavedExplanations(user.uid)
        .then(setExplanations)
        .finally(() => setIsLoading(false));
    }
  }, [user, router]);
  
  const onDelete = async () => {
    if (!itemToDelete || !user) return;
    setIsDeleting(true);
    const result = await handleDeleteExplanation(user.uid, itemToDelete);
    if(result.success) {
      setExplanations(explanations.filter(e => e.id !== itemToDelete));
      toast({
        title: "Explanation Deleted",
        description: "The explanation has been successfully deleted.",
      })
    } else {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Could not delete the explanation. Please try again.",
      })
    }
    setItemToDelete(null);
    setIsDeleting(false);
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this concept explanation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto max-w-4xl py-12 px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-headline text-3xl font-bold">My Explanations</h1>
              <p className="text-muted-foreground">Review concepts you've explored.</p>
            </div>
          </div>
        </div>

        {explanations.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-20 text-center">
            <CardHeader>
              <div className="mx-auto bg-muted p-4 rounded-full w-fit">
                <BrainCircuit className="h-10 w-10 text-muted-foreground" />
              </div>
              <CardTitle className="mt-4 font-headline">No Explanations Found</CardTitle>
              <CardDescription>You haven't saved any concept explanations yet. Highlight text in a summary to start.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-4">
            {explanations.map(item => (
              <Card key={item.id}>
                <Accordion type="single" collapsible>
                    <AccordionItem value={item.id} className="border-b-0">
                        <CardHeader className="p-4">
                             <div className="flex justify-between items-start gap-4">
                                <AccordionTrigger className="flex-1 text-left p-0 hover:no-underline">
                                    <div className='w-full'>
                                        <CardTitle className="font-headline text-xl">{item.highlightedText}</CardTitle>
                                        <CardDescription className="mt-1">
                                            Saved {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                        </CardDescription>
                                    </div>
                                </AccordionTrigger>
                                <Button variant="ghost" size="icon" className="h-8 w-8 mt-1" onClick={() => setItemToDelete(item.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </CardHeader>
                        <AccordionContent>
                           <CardContent className="p-4 pt-0 space-y-4">
                                <div>
                                    <h3 className="font-headline text-md font-semibold mb-1">Explanation</h3>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{item.explanation}</p>
                                </div>
                                <div>
                                    <h3 className="font-headline text-md font-semibold mb-1">Example</h3>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{item.example}</p>
                                </div>
                           </CardContent>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
