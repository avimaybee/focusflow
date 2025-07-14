
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Copy, RefreshCw, User, Album, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import { Button } from './ui/button';
import { FlashcardViewer } from './flashcard-viewer';
import { QuizViewer } from './quiz-viewer';
import { SmartToolsMenu, type SmartTool } from './smart-tools-menu';
import { useToast } from '@/hooks/use-toast';
import type { Timestamp } from 'firebase/firestore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

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
  createdAt?: Timestamp;
  isError?: boolean;
  isFirstInGroup?: boolean;
  onToolAction?: (tool: SmartTool, text?: string) => void;
};

export function ChatMessage({
  role,
  text,
  rawText,
  images,
  flashcards,
  quiz,
  userAvatar,
  userName,
  isError = false,
  isFirstInGroup = true,
  onToolAction,
}: ChatMessageProps) {
  const isUser = role === 'user';
  const { toast } = useToast();

  const handleCopy = () => {
    const textToCopy =
      rawText || (typeof text === 'string' ? text.replace(/<[^>]*>/g, '') : '');
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
    });
  };

  const handleFeatureAction = (featurePrompt: (text: string) => string) => {
    if (onToolAction && rawText) {
      const tool: SmartTool = {
        name: 'feature', // Name doesn't matter as much here
        prompt: featurePrompt,
        icon: <></>, // Icon not used in this path
      };
      onToolAction(tool, rawText);
    }
  };

  const renderContent = () => {
    if (flashcards) {
      return <FlashcardViewer flashcards={flashcards} />;
    }
    if (quiz) {
      return <QuizViewer quiz={quiz} />;
    }
    if (typeof text === 'string') {
      return (
        <div
          className={cn('prose-styles', isError && 'text-destructive')}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      );
    }
    return text;
  };

  const avatar = (
    <Avatar
      className={cn(
        'h-8 w-8',
        !isFirstInGroup && 'opacity-0',
        isUser ? '' : 'bg-accent/50 text-accent-foreground border border-accent'
      )}
    >
      {isUser ? (
        <>
          <AvatarImage src={userAvatar || undefined} data-ai-hint="person" />
          <AvatarFallback>
            {userName === 'Guest' ? <User className="h-5 w-5" /> : userName?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </>
      ) : (
        <AvatarFallback className="bg-transparent">
          <Bot className="h-5 w-5" />
        </AvatarFallback>
      )}
    </Avatar>
  );

  return (
    <div
      className={cn(
        'group flex items-start gap-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-500',
        isUser && 'justify-end',
        !isFirstInGroup && 'mt-1',
        isFirstInGroup && 'mt-4'
      )}
    >
      {!isUser && avatar}
      <div
        className={cn(
          'flex flex-col gap-1',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          style={{ lineHeight: 1.5 }}
          className={cn(
            'max-w-2xl p-3 text-sm rounded-xl',
            isUser
              ? 'bg-gradient-to-br from-primary to-blue-700 text-primary-foreground'
              : 'bg-secondary',
            isError && 'bg-destructive/10 border border-destructive/20'
          )}
        >
          {renderContent()}
          {images && images.length > 0 && (
            <div className="mt-2 grid gap-2 grid-cols-2">
              {images.map(
                (img, index) =>
                  img && (
                    <div key={index} className="relative h-48 w-48">
                      <Image
                        src={img}
                        alt="User upload"
                        layout="fill"
                        className="rounded-md object-contain"
                      />
                    </div>
                  )
              )}
            </div>
          )}
        </div>
        {!isUser && !isError && onToolAction && rawText && (
          <TooltipProvider>
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex items-center gap-1 rounded-full bg-card p-1 shadow-sm border">
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleCopy}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Copy</p></TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleRetry}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Retry</p></TooltipContent>
                </Tooltip>
                 <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => handleFeatureAction((text) => `Create a set of 10 flashcards from the following text, focusing on key terms and concepts: "${text}"`)}
                        >
                            <Album className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Create Flashcards</p></TooltipContent>
                </Tooltip>
                 <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => handleFeatureAction((text) => `Create a 5-question multiple-choice quiz based on this text, with 'medium' difficulty: "${text}"`)}
                        >
                            <HelpCircle className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Create Quiz</p></TooltipContent>
                </Tooltip>
              </div>
              <SmartToolsMenu
                onAction={(tool) => onToolAction(tool, rawText)}
              />
            </div>
          </TooltipProvider>
        )}
      </div>
      {isUser && avatar}
    </div>
  );
}
