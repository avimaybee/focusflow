
'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FlashcardViewer } from '@/components/flashcard-viewer';
import { BackButton } from '@/components/ui/back-button';

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
                setIsLoading(true);
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
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        );
    }
    
    if (!flashcardSet) {
        notFound();
    }

  return (
    <main className="flex-grow bg-secondary/30">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <BackButton href="/my-content" label="Back to My Content" className="mb-4" />
            {flashcardSet.flashcards && flashcardSet.flashcards.length > 0 ? (
                 <Card>
                    <CardHeader>
                        <CardTitle>{flashcardSet.title}</CardTitle>
                    </CardHeader>
                    <FlashcardViewer flashcards={flashcardSet.flashcards} />
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                    <CardTitle>Flashcard Set Details</CardTitle>
                    <CardDescription>
                        This set has no flashcards.
                    </CardDescription>
                    </CardHeader>
                </Card>
            )}
        </div>
    </main>
  );
}
