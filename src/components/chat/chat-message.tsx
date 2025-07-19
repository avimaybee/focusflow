'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User, Album, HelpCircle, Save, RotateCw, Copy, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { FlashcardViewer } from '@/components/flashcard-viewer';
import { QuizViewer } from '@/components/quiz-viewer';
import { SmartToolsMenu, type SmartTool } from '@/components/smart-tools-menu';
import { useToast } from '@/hooks/use-toast';
import type { Timestamp } from 'firebase/firestore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/auth-context';
import { saveChatMessage } from '@/lib/content-actions';
import { TextSelectionMenu } from '@/components/notes/text-selection-menu';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

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

interface Persona {
    id: string;
    name: string;
    avatarUrl: string;
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
  persona?: Persona;
  source?: { type: 'file' | 'text'; name: string };
  confidence?: 'high' | 'medium' | 'low';
  createdAt?: Timestamp;
  isError?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  onToolAction?: (tool: SmartTool, text?: string) => void;
  onRegenerate?: () => void;
};

export function ChatMessage({
  id,
  role,
  text,
  rawText,
  images,
  flashcards,
  quiz,
  userAvatar,
  userName,
  persona,
  source,
  confidence,
  isError = false,
  isFirstInGroup = true,
  isLastInGroup = true,
  onToolAction,
  onRegenerate,
}: ChatMessageProps) {
  const isUser = role === 'user';
  const { user } = useAuth();
  const { toast } = useToast();
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    if (rawText) {
      navigator.clipboard.writeText(rawText);
      toast({
        title: 'Copied to clipboard!',
      });
    }
  };

  const handleSave = async () => {
    if (!user || !rawText) {
      toast({
        variant: 'destructive',
        title: 'Could not save message',
        description: 'You must be logged in and the message must have content.',
      });
      return;
    }
    try {
      await saveChatMessage(user.uid, rawText);
      toast({
        title: 'Message Saved!',
        description: 'You can find it in your "My Content" page.',
      });
    } catch (error) {
      console.error('Error saving chat message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'There was a problem saving your message.',
      });
    }
  };

  const handleFeatureAction = (featurePrompt: (text: string) => string) => {
    if (onToolAction && rawText) {
      const tool: SmartTool = {
        name: 'feature',
        prompt: featurePrompt,
        icon: <></>,
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
        <MarkdownRenderer
          className={cn('prose-styles', isError && 'text-destructive')}
          content={text}
        />
      );
    }
    return text;
  };

  const ConfidenceIndicator = () => {
      if (!confidence) return null;
      const confidenceMap = {
          high: { text: 'High confidence', icon: <CheckCircle className="h-3.5 w-3.5 text-green-500" />, className: 'text-green-500' },
          medium: { text: 'Medium confidence', icon: <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />, className: 'text-yellow-500' },
          low: { text: 'Low confidence - Please verify', icon: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />, className: 'text-red-500' },
      }
      const { text, icon, className } = confidenceMap[confidence];
      return (
          <div className={cn("flex items-center gap-1.5 text-xs", className)}>
              {icon}
              <span>{text}</span>
          </div>
      )
  }

  const SourceIndicator = () => {
      if (!source) return null;
      return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span>Based on: {source.name}</span>
          </div>
      )
  }

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
        <>
          <AvatarImage src={persona?.avatarUrl} alt={persona?.name} />
          <AvatarFallback className="bg-transparent">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </>
      )}
    </Avatar>
  );

  return (
    <div
      className={cn(
        'group flex items-start gap-3',
        isUser && 'justify-end'
      )}
    >
      {!isUser && avatar}
      <div
        className={cn(
          'flex flex-col gap-1',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {!isUser && isFirstInGroup && (
            <p className="text-xs text-muted-foreground font-medium ml-2">{persona?.name || 'AI Assistant'}</p>
        )}
        <div
          ref={contentRef}
          style={{ lineHeight: 1.5 }}
          className={cn(
            'relative max-w-2xl p-3 px-4 text-base rounded-2xl',
            isUser
              ? 'bg-blue-600 text-primary-foreground'
              : 'bg-secondary',
            isError && 'bg-destructive/10 border border-destructive/20'
          )}
        >
          {!isUser && (
             <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {user && <TextSelectionMenu containerRef={contentRef} />}
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
          {(source || confidence) && (
            <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
                <SourceIndicator />
                <ConfidenceIndicator />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {!isUser && !isError && (
            <TooltipProvider>
              <div className="flex items-center gap-1 rounded-full bg-card p-1 shadow-sm border">
                {isLastInGroup && onRegenerate && (
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={onRegenerate}>
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Regenerate</p></TooltipContent>
                  </Tooltip>
                )}
                {user && rawText && (
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleSave}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Save to My Content</p></TooltipContent>
                  </Tooltip>
                )}
                {rawText && onToolAction && (
                  <>
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
                  </>
                )}
              </div>
              {rawText && onToolAction && (
                <SmartToolsMenu
                  onAction={(tool) => onToolAction(tool, rawText)}
                />
              )}
            </TooltipProvider>
          )}
        </div>
      </div>
      {isUser && avatar}
    </div>
  );
}
