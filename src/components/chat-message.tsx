
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Sparkles, Copy, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { SmartToolsMenu, smartTools } from './smart-tools-menu';
import { FlashcardViewer } from './flashcard-viewer';
import { QuizViewer } from './quiz-viewer';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Badge } from './ui/badge';
import type { Timestamp } from 'firebase/firestore';


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
  id?: string;
  role: 'user' | 'model';
  text: string | React.ReactNode;
  rawText?: string;
  images?: (string | null)[];
  flashcards?: FlashcardData[];
  quiz?: QuizData;
  userAvatar?: string | null;
  userName?: string;
  onSmartToolAction?: (tool: typeof smartTools[0], text: string) => void;
  isPremiumFeature?: boolean;
  createdAt?: Timestamp;
  isError?: boolean;
};

export function ChatMessage({ role, text, rawText, images, flashcards, quiz, userAvatar, userName, onSmartToolAction, isPremiumFeature = false, isError = false }: ChatMessageProps) {
  const isUser = role === 'user';
  const messageRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleCopy = () => {
    const textToCopy = rawText || (typeof text === 'string' ? text.replace(/<[^>]*>/g, '') : '');
    if (textToCopy) {
        navigator.clipboard.writeText(textToCopy);
        toast({
            title: 'Copied to clipboard!',
            description: 'The message content has been copied.',
        });
    }
  };

  const handleRetry = () => {
    // This would need to be wired up to the chat submission logic
    toast({
        title: 'Retry functionality coming soon!',
    })
  }
  
  const renderContent = () => {
    if (flashcards) {
      return <FlashcardViewer flashcards={flashcards} />;
    }
    if (quiz) {
      return <QuizViewer quiz={quiz} />;
    }
    if (typeof text === 'string') {
      return <div className={cn(isError && 'text-destructive')} dangerouslySetInnerHTML={{ __html: text }} />;
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
      <div className="flex flex-col items-start gap-1" ref={messageRef}>
        <div
          style={{ lineHeight: 1.5 }}
          className={cn(
            'max-w-2xl rounded-xl p-3 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted',
            // Only apply prose styles if it's a simple string message
            typeof text === 'string' && !flashcards && !quiz && 'prose-styles',
            isError && 'bg-destructive/10 border border-destructive/20'
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
        {!isUser && typeof text === 'string' && onSmartToolAction && !isError && (
          <div className="flex items-center gap-1 rounded-full bg-card p-1 shadow-sm border">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-auto p-0">
                <SmartToolsMenu onAction={(tool) => onSmartToolAction(tool, text as string)} />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4" />
            </Button>
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
