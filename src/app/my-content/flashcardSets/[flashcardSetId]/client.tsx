"use client";

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { FlashcardViewer } from '@/components/flashcard-viewer';
import { BackButton } from '@/components/ui/back-button';

interface FlashcardSet {
    title: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    flashcards: any[];
    createdAt: Date; // Replaced Timestamp with Date
}

export default function FlashcardSetDetailPage() {
    const { user, loading: authLoading } = useAuth();
    const params = useParams();
    const router = useRouter();
    const flashcardSetId = params.flashcardSetId as string;
    const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Placeholder for fetching data from Supabase
        if (flashcardSetId) {
            setFlashcardSet({
                title: 'Placeholder Flashcard Set',
                flashcards: [
                    { question: 'What is the capital of France?', answer: 'Paris' },
                    { question: 'What is 2 + 2?', answer: '4' },
                ],
                createdAt: new Date(),
            });
        }
        setIsLoading(false);
    }, [flashcardSetId]);

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
