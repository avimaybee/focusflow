
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

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
  const [direction, setDirection] = useState(0);

  if (!flashcards || flashcards.length === 0) {
    return <p>No flashcards available.</p>;
  }

  const handleNext = () => {
    setDirection(1);
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev + 1) % flashcards.length), 150);
  };

  const handlePrev = () => {
    setDirection(-1);
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length), 150);
  };

  const currentCard = flashcards[currentIndex];

  const cardVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <div className="w-full max-w-md mx-auto my-4 flex flex-col gap-4">
       <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Flashcards</h3>
        <p className="text-sm text-muted-foreground">
          {currentIndex + 1} / {flashcards.length}
        </p>
      </div>
      <div className="relative h-64 w-full perspective-1000">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
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
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={handlePrev}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button variant="outline" onClick={() => setIsFlipped(!isFlipped)}>
          <RefreshCw className="mr-2 h-4 w-4" /> Flip Card
        </Button>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
