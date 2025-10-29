

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/auth-context';
import { saveChatMessage } from '@/lib/content-actions';
import { TextSelectionMenu } from '@/components/notes/text-selection-menu';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import type { PersonaDetails } from '@/types/chat-types';

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
  persona?: PersonaDetails;
  createdAt?: Date;
  source?: unknown;
  confidence?: unknown;
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
      await saveChatMessage(user.id, rawText);
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
      <div
        className={cn(
          'prose-styles',
          isUser
            ? 'prose-p:my-0 prose-headings:text-primary-foreground prose-p:text-primary-foreground prose-strong:text-primary-foreground prose-li:text-primary-foreground prose-code:text-primary-foreground prose-a:text-primary'
            : undefined
        )}
      >
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
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
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
              'relative max-w-full sm:max-w-2xl px-4 py-3 text-sm leading-6',
              'rounded-2xl border shadow-[0_18px_40px_-30px_rgba(15,23,42,0.72)] transition-shadow duration-300',
              isUser
                ? 'bg-primary text-primary-foreground border-stroke-subtle/20'
                : 'bg-surface-muted/85 text-foreground border-stroke-subtle/70 backdrop-blur-sm',
              isUser
                ? (isFirstInGroup ? 'rounded-tr-2xl' : 'rounded-tr-xl')
                : (isFirstInGroup ? 'rounded-tl-2xl' : 'rounded-tl-xl'),
              isUser
                ? (isLastInGroup ? 'rounded-br-3xl' : 'rounded-br-xl')
                : (isLastInGroup ? 'rounded-bl-3xl' : 'rounded-bl-xl'),
              isError && 'bg-destructive/20 border border-destructive text-destructive-foreground'
            )}
          >
            {user && <TextSelectionMenu containerRef={contentRef} />}
            {renderContent()}
          </div>
          {!isUser && !isError && (
            <div className="flex items-center gap-2 transition-opacity duration-200">
              <TooltipProvider>
                <div className="flex items-center gap-1.5 rounded-full border border-stroke-subtle/70 bg-surface-soft/90 px-1.5 py-1 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]">
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:ring-1 focus-visible:ring-primary/40"
                        onClick={handleCopy}
                        aria-label="Copy message"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Copy</p></TooltipContent>
                  </Tooltip>
                  {isLastInGroup && onRegenerate && (
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:ring-1 focus-visible:ring-primary/40"
                          onClick={onRegenerate}
                          aria-label="Regenerate response"
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Regenerate</p></TooltipContent>
                    </Tooltip>
                  )}
                  {user && rawText && (
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:ring-1 focus-visible:ring-primary/40"
                          onClick={handleSave}
                          aria-label="Save to My Content"
                        >
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
                            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:ring-1 focus-visible:ring-primary/40"
                            onClick={() => handleFeatureAction((text) => `Create a set of 10 flashcards that cover the key concepts from this response:\n${text}`)}
                            aria-label="Create flashcards from response"
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
                            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:ring-1 focus-visible:ring-primary/40"
                            onClick={() => handleFeatureAction((text) => `Create a 5-question multiple-choice quiz (medium difficulty) using this response as source material:\n${text}`)}
                            aria-label="Create quiz from response"
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
