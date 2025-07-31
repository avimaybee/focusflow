

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
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
  createdAt?: Timestamp;
  isError?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  onToolAction?: (tool: SmartTool, text?: string) => void;
  onRegenerate?: () => void;
  attachments?: { url: string; name: string; contentType: string; size: number; }[];
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
  isError = false,
  isFirstInGroup = true,
  isLastInGroup = true,
  onToolAction,
  onRegenerate,
  attachments,
}: ChatMessageProps) {
  const isUser = role === 'user';
  const { user } = useAuth();
  const { toast } = useToast();
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    const textToCopy =
      rawText || (typeof text === 'string' ? text.replace(/<[^>]*>/g, '') : '');
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
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
    return (
      <div className="prose-styles prose-sm leading-relaxed">
        {typeof text === 'string' ? (
          <MarkdownRenderer
            content={text}
          />
        ) : (
          text
        )}
        {attachments && attachments.length > 0 && (
          <div className="mt-2 grid gap-2 grid-cols-2">
            {attachments.map((att, index) => (
              <div key={att.url || index} className="relative h-48 w-48">
                {att.contentType.startsWith('image/') ? (
                  <Image
                    src={att.url}
                    alt={att.name || 'Attached image'}
                    layout="fill"
                    className="rounded-md object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-muted rounded-md text-muted-foreground text-center p-2">
                    <p className="break-all text-xs">{att.name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
    );
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
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
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
            className={cn(
              'relative max-w-full sm:max-w-xl p-3 text-base shadow-sm',
              'rounded-xl',
              isUser
                ? 'bg-gradient-to-br from-primary to-blue-700 text-primary-foreground'
                : 'bg-secondary',
              isUser ? (isFirstInGroup ? 'rounded-tr-xl' : 'rounded-tr-md') : (isFirstInGroup ? 'rounded-tl-xl' : 'rounded-tl-md'),
              isUser ? (isLastInGroup ? 'rounded-br-xl' : 'rounded-br-md') : (isLastInGroup ? 'rounded-bl-xl' : 'rounded-bl-md'),
              isError && 'bg-destructive/20 border border-destructive text-destructive-foreground'
            )}
          >
            {user && <TextSelectionMenu containerRef={contentRef} />}
            {renderContent()}
          </div>
          {!isUser && !isError && (
            <div className="flex items-center gap-1.5 transition-opacity duration-200">
              <TooltipProvider>
                <div className="flex items-center gap-1 rounded-full bg-card p-1 shadow-sm border">
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Copy</p></TooltipContent>
                  </Tooltip>
                  {isLastInGroup && onRegenerate && (
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={onRegenerate}>
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Regenerate</p></TooltipContent>
                    </Tooltip>
                  )}
                  {user && rawText && (
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={handleSave}>
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
                            className="h-6 w-6 rounded-full"
                            onClick={() => handleFeatureAction((text) => `Create a set of 10 flashcards from the following text, focusing on key terms and concepts: "'\''\''${text}'\''\''"`)}
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
                            className="h-6 w-6 rounded-full"
                            onClick={() => handleFeatureAction((text) => `Create a 5-question multiple-choice quiz based on this text, with 'medium' difficulty: "'\''\''${text}'\''\''"`)}
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
            </div>
          )}
        </div>
        {isUser && avatar}
      </motion.div>
    </>
  );
}
