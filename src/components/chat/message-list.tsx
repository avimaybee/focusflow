
'use client';

import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage, ChatMessageProps } from '../chat-message';
import { Loader2 } from 'lucide-react';
import { WelcomeScreen } from './welcome-screen';
import { RefObject } from 'react';
import { ChatMessageSkeleton } from './chat-message-skeleton';
import type { SmartTool } from '@/components/smart-tools-menu';

interface Persona {
    id: string;
    name: string;
    avatarUrl: string;
}

interface MessageListProps {
  messages: ChatMessageProps[];
  isSending: boolean;
  isHistoryLoading: boolean;
  activeChatId: string | null;
  activePersona: Persona | null;
  scrollAreaRef: RefObject<HTMLDivElement>;
  onSmartToolAction: (prompt: string) => void;
  onRegenerate: () => void;
}

export function MessageList({
  messages,
  isSending,
  isHistoryLoading,
  activeChatId,
  activePersona,
  scrollAreaRef,
  onSmartToolAction,
  onRegenerate,
}: MessageListProps) {
  if (isHistoryLoading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const showWelcomeScreen = !activeChatId && messages.length === 0 && !isSending;

  const handleToolAction = (tool: SmartTool, text?: string) => {
    if (!text) return;
    const prompt = tool.prompt(text);
    onSmartToolAction(prompt);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <ScrollArea className="h-full" ref={scrollAreaRef}>
        {showWelcomeScreen ? (
          <WelcomeScreen onSelectPrompt={onSmartToolAction} />
        ) : (
          <div className="p-3 md:p-4 space-y-2 max-w-3xl mx-auto">
            {messages.map((msg, index) => (
              <ChatMessage
                key={msg.id || index}
                {...msg}
                onToolAction={handleToolAction}
                onRegenerate={onRegenerate}
              />
            ))}
            {isSending && messages.at(-1)?.role === 'user' && (
               <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <ChatMessageSkeleton persona={activePersona || undefined} />
                </motion.div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
