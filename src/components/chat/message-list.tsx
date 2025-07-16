'use client';

import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage, ChatMessageProps } from '@/components/chat-message';
import { Loader2 } from 'lucide-react';
import { WelcomeScreen } from './welcome-screen';
import { RefObject } from 'react';
import { ChatMessageSkeleton } from './chat-message-skeleton';
import type { SmartTool } from '@/components/smart-tools-menu';
import { SuggestedPrompts } from './suggested-prompts';

interface MessageListProps {
  messages: ChatMessageProps[];
  isSending: boolean;
  isHistoryLoading: boolean;
  activeChatId: string | null;
  scrollAreaRef: RefObject<HTMLDivElement>;
  onSelectPrompt: (prompt: string) => void;
  onSmartToolAction: (prompt: string) => void;
  onRegenerate: () => void;
  suggestions: string[];
}

export function MessageList({
  messages,
  isSending,
  isHistoryLoading,
  activeChatId,
  scrollAreaRef,
  onSelectPrompt,
  onSmartToolAction,
  onRegenerate,
  suggestions,
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
          <WelcomeScreen onSelectPrompt={onSelectPrompt} />
        ) : (
          <div className="p-6 md:p-8 space-y-6 max-w-full sm:max-w-3xl lg:max-w-4xl mx-auto">
            {messages.map((msg, index) => {
              const prevMessage = messages[index - 1];
              const nextMessage = messages[index + 1];

              const isFirstInGroup = !prevMessage || prevMessage.role !== msg.role;
              const isLastInGroup = !nextMessage || nextMessage.role !== msg.role;

              return (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <ChatMessage
                    {...msg}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                    onToolAction={handleToolAction}
                    onRegenerate={onRegenerate}
                  />
                </motion.div>
              );
            })}
            {isSending && messages.at(-1)?.role === 'user' && (
               <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <ChatMessageSkeleton />
                </motion.div>
            )}
            {!isSending && suggestions.length > 0 && messages.at(-1)?.role === 'model' && (
              <SuggestedPrompts suggestions={suggestions} onPromptSelect={onSelectPrompt} />
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}