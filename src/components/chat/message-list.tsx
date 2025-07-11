
'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage, ChatMessageProps } from '@/components/chat-message';
import { Loader2 } from 'lucide-react';
import { WelcomeScreen } from './welcome-screen';
import { RefObject } from 'react';

interface MessageListProps {
  messages: ChatMessageProps[];
  isLoading: boolean;
  isHistoryLoading: boolean;
  activeChatId: string | null;
  scrollAreaRef: RefObject<HTMLDivElement>;
  onSelectPrompt: (prompt: string) => void;
  onSmartToolAction: (tool: any, messageText: string) => void;
}

export function MessageList({
  messages,
  isLoading,
  isHistoryLoading,
  activeChatId,
  scrollAreaRef,
  onSelectPrompt,
  onSmartToolAction,
}: MessageListProps) {
  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <ScrollArea className="h-full" ref={scrollAreaRef}>
        <div className="p-6 md:p-8 space-y-8 max-w-full sm:max-w-3xl lg:max-w-4xl mx-auto">
          {isHistoryLoading ? (
            <div className="flex justify-center items-center h-[calc(100vh-280px)]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !activeChatId && !hasMessages ? (
            <WelcomeScreen onSelectPrompt={onSelectPrompt} />
          ) : (
            messages.map((msg, index) => (
              <ChatMessage
                key={index}
                {...msg}
                onSmartToolAction={onSmartToolAction}
              />
            ))
          )}
          {isLoading && (
            <ChatMessage role="model" text={<div className="h-5 w-5 border-2 rounded-full border-t-transparent animate-spin"></div>} />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
