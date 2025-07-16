
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FlashcardViewer } from '@/components/flashcard-viewer';

interface FlashcardSet {
    title: string;
    flashcards: any[];
    createdAt: Timestamp;
}

export default function FlashcardSetDetailPage() {
    const { user, loading: authLoading } = useAuth();
    const params = useParams();
    const router = useRouter();
    const flashcardSetId = params.flashcardSetId as string;
    const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        if (user && flashcardSetId) {
            const fetchSet = async () => {
                const docRef = doc(db, 'users', user.uid, 'flashcardSets', flashcardSetId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setFlashcardSet(docSnap.data() as FlashcardSet);
                } else {
                    setFlashcardSet(null);
                }
                setIsLoading(false);
            };
            fetchSet();
        }
    }, [user, flashcardSetId, authLoading, router]);

    if (isLoading || authLoading) {
        return (
          <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        );
    }
    
    if (!flashcardSet) {
        notFound();
    }

  return (
    <>
      <main className="flex-grow bg-secondary/30">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/my-content">← Back to My Content</Link>
            </Button>
            {flashcardSet.flashcards && flashcardSet.flashcards.length > 0 ? (
                <FlashcardViewer flashcards={flashcardSet.flashcards} />
            ) : (
                <Card>
                    <CardHeader>
                    <CardTitle>Flashcard Set Details</CardTitle>
                    <CardDescription>
                        This set has no flashcards.
                    </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-16">
                    <p className="text-muted-foreground">Could not load flashcards.</p>
                    </CardContent>
                </Card>
            )}
        </div>
      </main>
    </>
  );
}
