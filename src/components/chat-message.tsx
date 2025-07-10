
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { Button } from './ui/button';

export type ChatMessageProps = {
  role: 'user' | 'model';
  text: string | React.ReactNode;
  image?: string | null;
  userAvatar?: string | null;
  userName?: string;
  onShowTools?: (target: HTMLElement) => void;
};

export function ChatMessage({ role, text, image, userAvatar, userName, onShowTools }: ChatMessageProps) {
  const isUser = role === 'user';
  const toolsButtonRef = React.useRef<HTMLButtonElement>(null);
  const messageRef = React.useRef<HTMLDivElement>(null);

  const handleToolButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent closing the menu if it was just opened
    if (messageRef.current && onShowTools) {
        onShowTools(messageRef.current);
    }
  };
  
  return (
    <div className={cn('flex items-start gap-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-500', isUser && 'justify-end')}>
      {!isUser && (
        <Avatar className="h-8 w-8 bg-accent/50 text-accent-foreground border border-accent">
            <AvatarFallback className="bg-transparent"><Bot className="h-5 w-5"/></AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col items-start gap-1 group/message" ref={messageRef}>
        <div
          style={{ lineHeight: 1.5 }}
          className={cn(
            'max-w-2xl rounded-xl p-3 text-sm prose-styles',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          {typeof text === 'string' ? <div dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br />') }} /> : text}
          {image && (
              <div className="mt-2 relative h-48 w-48">
                  <Image src={image} alt="User upload" layout="fill" className="rounded-md object-contain" />
              </div>
          )}
        </div>
        {!isUser && typeof text === 'string' && onShowTools && (
            <Button
                ref={toolsButtonRef}
                variant="ghost"
                size="sm"
                className="h-auto px-1.5 py-0.5 text-xs text-muted-foreground opacity-0 group-hover/message:opacity-100 focus-within:opacity-100 transition-opacity"
                onClick={handleToolButtonClick}
            >
                <Sparkles className="h-3 w-3 mr-1" />
                Tools
            </Button>
        )}
      </div>
      {isUser && (
        <Avatar className="h-8 w-8">
            <AvatarImage src={userAvatar || undefined} data-ai-hint="person" />
            <AvatarFallback>{userName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
