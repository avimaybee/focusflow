
'use client';

import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage, ChatMessageProps } from '@/components/chat-message';
import { Loader2 } from 'lucide-react';
import { WelcomeScreen } from './welcome-screen';
import { RefObject } from 'react';

interface MessageListProps {
  messages: ChatMessageProps[];
  isSending: boolean;
  isHistoryLoading: boolean;
  activeChatId: string | null;
  scrollAreaRef: RefObject<HTMLDivElement>;
  onSelectPrompt: (prompt: string) => void;
}

export function MessageList({
  messages,
  isSending,
  isHistoryLoading,
  activeChatId,
  scrollAreaRef,
  onSelectPrompt,
}: MessageListProps) {
  
  if (isHistoryLoading) {
    return (
        <div className="flex-1 flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const showWelcomeScreen = !activeChatId && messages.length === 0 && !isSending;

  return (
    <div className="flex-1 overflow-y-auto">
      <ScrollArea className="h-full" ref={scrollAreaRef}>
        {showWelcomeScreen ? (
          <WelcomeScreen onSelectPrompt={onSelectPrompt} />
        ) : (
          <div className="p-6 md:p-8 space-y-4 max-w-full sm:max-w-3xl lg:max-w-4xl mx-auto">
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <ChatMessage {...msg} />
                </motion.div>
              ))}
            {isSending && messages.at(-1)?.role === 'user' && (
              <ChatMessage role="model" text={
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary/50 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 bg-primary/50 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 bg-primary/50 rounded-full animate-pulse"></div>
                </div>
              } />
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
