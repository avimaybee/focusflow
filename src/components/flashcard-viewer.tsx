
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardViewerProps {
  flashcards: Flashcard[];
}

export function FlashcardViewer({ flashcards }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return <p>No flashcards available.</p>;
  }

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const currentCard = flashcards[currentIndex];

  return (
    <div className="w-full max-w-md mx-auto my-4">
      <div className="relative h-64 w-full perspective-1000">
        <div
          className={cn(
            'absolute inset-0 w-full h-full transition-transform duration-700 transform-style-preserve-3d',
            isFlipped ? 'rotate-y-180' : ''
          )}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front of the card */}
          <Card className="absolute w-full h-full backface-hidden flex items-center justify-center p-6">
            <CardContent className="text-center">
              <p className="text-lg font-semibold">{currentCard.question}</p>
            </CardContent>
          </Card>
          {/* Back of the card */}
          <Card className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center p-6 bg-secondary">
            <CardContent className="text-center">
              <p className="text-base">{currentCard.answer}</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <Button variant="ghost" size="icon" onClick={handlePrev}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-sm text-muted-foreground">
          {currentIndex + 1} / {flashcards.length}
        </div>
        <Button variant="ghost" size="icon" onClick={handleNext}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
