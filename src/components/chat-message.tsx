'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import Image from 'next/image';

export type ChatMessageProps = {
  role: 'user' | 'model';
  text: string | React.ReactNode;
  image?: string;
  userAvatar?: string | null;
  userName?: string;
};

export function ChatMessage({ role, text, image, userAvatar, userName }: ChatMessageProps) {
  const isUser = role === 'user';
  
  return (
    <div className={cn('flex items-start gap-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-500', isUser && 'justify-end')}>
      {!isUser && (
        <Avatar className="h-8 w-8">
            <AvatarFallback><Bot/></AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-xl rounded-lg p-3 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        {typeof text === 'string' ? <p className="whitespace-pre-wrap">{text}</p> : text}
        {image && (
            <div className="mt-2 relative h-48 w-48">
                <Image src={image} alt="User upload" layout="fill" className="rounded-md object-contain" />
            </div>
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
