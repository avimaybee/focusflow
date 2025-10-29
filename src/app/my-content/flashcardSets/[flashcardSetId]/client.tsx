"use client";

import { Loader2 } from 'lucide-react';
import { useParams, notFound } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { FlashcardViewer } from '@/components/flashcard-viewer';
import { format } from 'date-fns';

interface FlashcardSet {
    title: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    flashcards: any[];
    createdAt: Date; // Replaced Timestamp with Date
}

export default function FlashcardSetDetailPage() {
    const { loading: authLoading } = useAuth();
    const params = useParams();
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
        <div className="mx-auto w-full max-w-3xl space-y-6">
            <header className="space-y-1">
                <h1 className="text-3xl font-bold">{flashcardSet.title}</h1>
                <p className="text-sm text-muted-foreground">
                    Created on {format(flashcardSet.createdAt, 'MMMM dd, yyyy')}
                </p>
            </header>
            {flashcardSet.flashcards && flashcardSet.flashcards.length > 0 ? (
                <FlashcardViewer flashcards={flashcardSet.flashcards} />
            ) : (
                <div className="rounded-xl border border-dashed border-border/70 bg-secondary/30 px-6 py-12 text-center text-sm text-muted-foreground">
                    This set does not include any flashcards yet.
                </div>
            )}
        </div>
    );
}
