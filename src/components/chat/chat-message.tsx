

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Album, HelpCircle, Save, Copy } from 'lucide-react';
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

// Persona color mapping - THE ACTUAL 10 PERSONAS
const getPersonaColor = (persona?: PersonaDetails): string => {
  if (!persona) return 'border-l-teal-500/50'; // Default
  
  const id = (persona.id || '').toLowerCase();
  const name = persona.name.toLowerCase();
  
  // 1. Gurt - The Guide 🎓
  if (id === 'gurt' || name.includes('gurt')) {
    return 'border-l-teal-500/50';
  }
  
  // 2. ELI5 - The Simplifier 👶 (aka "im a baby")
  if (id === 'eli5' || name.includes('eli5') || name.includes('baby') || name.includes('simplif')) {
    return 'border-l-green-500/50';
  }
  
  // 3. Straight Shooter - The Direct Answer 🎯
  if (id === 'straight-shooter' || name.includes('straight') || name.includes('direct')) {
    return 'border-l-cyan-500/50';
  }
  
  // 4. Essay Writer - The Academic Wordsmith ✍️
  if (id === 'essay-writer' || name.includes('essay') || name.includes('wordsmith')) {
    return 'border-l-purple-500/50';
  }
  
  // 5. Deep Dive Dynamo - The Understanding Builder 🧠 (aka "lore master")
  if (id === 'in-depth-explainer' || name.includes('deep') || name.includes('dynamo') || name.includes('lore')) {
    return 'border-l-blue-500/50';
  }
  
  // 6. Sassy Eva - The Fun Diva Teacher 💅 (aka "sassy tutor")
  if (id === 'sassy-eva' || name.includes('eva') || name.includes('sassy') || name.includes('diva')) {
    return 'border-l-pink-500/50';
  }
  
  // 7. Idea Fountain - The Creative Catalyst 💡 (aka "idea cook")
  if (id === 'brainstormer' || name.includes('idea') || name.includes('fountain') || name.includes('creative') || name.includes('cook')) {
    return 'border-l-orange-500/50';
  }
  
  // 8. Cram Master - The Speed Learner ⚡ (aka "memory coach")
  if (id === 'memory-coach' || name.includes('memory') || name.includes('cram') || name.includes('coach')) {
    return 'border-l-amber-500/50';
  }
  
  // 9. CodeMaster - The Programming Mentor 💻 (aka "code nerd")
  if (id === 'coding-guru' || name.includes('code') || name.includes('programming') || name.includes('nerd')) {
    return 'border-l-indigo-500/50';
  }
  
  // 10. Test Ace - The Exam Strategist 🎓 (aka "exam strategist")
  if (id === 'exam-strategist' || name.includes('exam') || name.includes('test') || name.includes('ace')) {
    return 'border-l-rose-500/50';
  }
  
  // Default fallback
  return 'border-l-teal-500/50';
};

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
  personaId?: string; // Track which persona generated this message
  createdAt?: Date;
  source?: unknown;
  confidence?: unknown;
  isError?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  onToolAction?: (tool: SmartTool, text?: string) => void;
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
      await saveChatMessage(user.id, { message_content: rawText });
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(
          'group flex w-full gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        <div
          className={cn(
            'flex flex-col gap-1 max-w-2xl sm:max-w-3xl',
            isUser ? 'items-end' : 'items-start'
          )}
        >
          {!isUser && isFirstInGroup && persona && (
            <p className="text-xs font-medium text-foreground/60 px-1">{persona.name || 'AI Assistant'}</p>
          )}

          <div
            ref={contentRef}
            className={cn(
              'relative w-full text-sm sm:text-[15px] leading-relaxed',
              isUser
                ? 'bg-primary/15 text-foreground px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl max-w-fit'
                : cn('text-foreground/90 border-l-2 pl-3 sm:pl-4', getPersonaColor(persona)),
              isError && 'bg-destructive/10 border border-destructive/30 text-destructive-foreground px-4 py-3 rounded-2xl'
            )}
          >
            {user && !isUser && <TextSelectionMenu containerRef={contentRef} />}
            {renderContent()}
          </div>

          {!isUser && !isError && (
            <div className="flex items-center gap-0.5 mt-1">
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md text-foreground/40 hover:bg-muted hover:text-foreground/70 transition-colors"
                      onClick={handleCopy}
                      aria-label="Copy message"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right"><p>Copy</p></TooltipContent>
                </Tooltip>

                {user && rawText && (
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md text-foreground/40 hover:bg-muted hover:text-foreground/70 transition-colors"
                        onClick={handleSave}
                        aria-label="Save to My Content"
                      >
                        <Save className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right"><p>Save</p></TooltipContent>
                  </Tooltip>
                )}

                {rawText && onToolAction && (
                  <>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md text-foreground/40 hover:bg-muted hover:text-foreground/70 transition-colors"
                          onClick={() => handleFeatureAction((text) => `Create a set of 10 flashcards that cover the key concepts from this response:\n${text}`)}
                          aria-label="Create flashcards"
                        >
                          <Album className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right"><p>Flashcards</p></TooltipContent>
                    </Tooltip>

                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md text-foreground/40 hover:bg-muted hover:text-foreground/70 transition-colors"
                          onClick={() => handleFeatureAction((text) => `Create a 5-question multiple-choice quiz (medium difficulty) using this response as source material:\n${text}`)}
                          aria-label="Create quiz"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right"><p>Quiz</p></TooltipContent>
                    </Tooltip>

                    <div className="h-7 w-7 flex items-center justify-center">
                      <SmartToolsMenu onAction={(tool) => onToolAction(tool, rawText)} />
                    </div>
                  </>
                )}
              </TooltipProvider>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
