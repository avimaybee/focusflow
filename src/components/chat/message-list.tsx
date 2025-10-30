
'use client';

import { motion } from 'framer-motion';
import { AIConversation, AIConversationContent, AIConversationScrollButton } from '@/components/ui/kibo-ui/ai/conversation';
import { ChatMessage, ChatMessageProps } from '@/components/chat/chat-message';
import { Loader2 } from 'lucide-react';
import { WelcomeScreen } from './welcome-screen';
import { ChatMessageSkeleton } from './chat-message-skeleton';
import type { SmartTool } from '@/components/smart-tools-menu';
import type { PersonaDetails } from '@/types/chat-types';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: ChatMessageProps[];
  isSending: boolean;
  isHistoryLoading: boolean;
  activeChatId: string | null;
  activePersona: PersonaDetails | undefined;
  onSmartToolAction: (prompt: string) => void;
  className?: string;
  contentClassName?: string;
}

export function MessageList({
  messages,
  isSending,
  isHistoryLoading,
  activeChatId,
  activePersona,
  onSmartToolAction,
  className,
  contentClassName,
}: MessageListProps) {
  if (isHistoryLoading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!messages) {
    // Defensive logging to help diagnose production issues where messages becomes undefined
    // eslint-disable-next-line no-console
    console.warn('MessageList received undefined messages');
  }

  const safeMessages = Array.isArray(messages) ? messages : [];

  const showWelcomeScreen = !activeChatId && safeMessages.length === 0 && !isSending;

  const handleToolAction = (tool: SmartTool, text?: string) => {
    if (!text) return;
    const prompt = tool.prompt(text);
    onSmartToolAction(prompt);
  };

  return (
    <AIConversation className={cn('flex-1', className)}>
        {showWelcomeScreen ? (
          <WelcomeScreen onSelectPrompt={onSmartToolAction} />
        ) : (
          <AIConversationContent
            className={cn(
              'max-w-3xl mx-auto space-y-4 md:space-y-6 p-3 md:p-6',
              contentClassName
            )}
          >
            {safeMessages.map((msg, index) => (
              <ChatMessage
                key={msg.id || index}
                {...msg}
                onToolAction={handleToolAction}
              />
            ))}
            {isSending && safeMessages.at(-1)?.role === 'user' && (
               <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <ChatMessageSkeleton persona={activePersona || undefined} />
                </motion.div>
            )}
          </AIConversationContent>
        )}
      <AIConversationScrollButton />
    </AIConversation>
  );
}
