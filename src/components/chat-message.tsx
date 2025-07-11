
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { Button } from './ui/button';

import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { SmartToolsMenu, smartTools } from './smart-tools-menu';

import { FlashcardViewer } from './flashcard-viewer';
import { QuizViewer } from './quiz-viewer';

import { Badge } from './ui/badge';

// Define types for flashcard and quiz data to be passed in props
interface FlashcardData {
  question: string;
  answer: string;
}
interface QuizData {
  title: string;
  questions: {
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

export type ChatMessageProps = {
  role: 'user' | 'model';
  text: string | React.ReactNode;
  images?: (string | null)[];
  flashcards?: FlashcardData[];
  quiz?: QuizData;
  userAvatar?: string | null;
  userName?: string;
  onSmartToolAction?: (tool: typeof smartTools[0], text: string) => void;
  isPremiumFeature?: boolean;
};

export function ChatMessage({ role, text, images, flashcards, quiz, userAvatar, userName, onSmartToolAction, isPremiumFeature = false }: ChatMessageProps) {
  const isUser = role === 'user';
  const messageRef = React.useRef<HTMLDivElement>(null);
  
  const renderContent = () => {
    if (flashcards) {
      return <FlashcardViewer flashcards={flashcards} />;
    }
    if (quiz) {
      return <QuizViewer quiz={quiz} />;
    }
    if (typeof text === 'string') {
      return <div dangerouslySetInnerHTML={{ __html: text }} />;
    }
    return text;
  };

  return (
    <div className={cn('flex items-start gap-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-500', isUser && 'justify-end')}>
      {!isUser && (
        <Avatar className="h-8 w-8 bg-accent/50 text-accent-foreground border border-accent">
            <AvatarFallback className="bg-transparent"><Bot className="h-5 w-5"/></AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col items-start gap-1 group/message" ref={messageRef}>
        <div
          style={{ lineHeight: 1.5 }}
          className={cn(
            'max-w-2xl rounded-xl p-3 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted',
            // Only apply prose styles if it's a simple string message
            typeof text === 'string' && !flashcards && !quiz && 'prose-styles'
          )}
        >
          {renderContent()}
          {images && images.length > 0 && (
              <div className="mt-2 grid gap-2 grid-cols-2">
                {images.map((img, index) => img && (
                  <div key={index} className="relative h-48 w-48">
                    <Image src={img} alt="User upload" layout="fill" className="rounded-md object-contain" />
                  </div>
                ))}
              </div>
          )}
        </div>
        {!isUser && typeof text === 'string' && onSmartToolAction && (
          <div className="opacity-0 group-hover/message:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-1.5 py-0.5 text-xs text-muted-foreground"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Tools
                </Button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-auto p-0">
                <SmartToolsMenu onAction={(tool) => onSmartToolAction(tool, text as string)} />
              </PopoverContent>
            </Popover>
            {isPremiumFeature && (
                <Link href="/premium">
                    <Badge variant="premium">Premium</Badge>
                </Link>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <Avatar className="h-8 w-8">
            <AvatarImage src={userAvatar || undefined} data-ai-hint="person" />
            <AvatarFallback>{userName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
