'use client';

import { useState, useRef, useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Logo } from '@/components/logo';
import { Send, Plus, MessageSquare } from 'lucide-react';
import { ChatMessage, ChatMessageProps } from '@/components/chat-message';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';


export default function ChatPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<ChatMessageProps[]>([
    {
      role: 'model',
      text: "Hello! I'm your AI study partner. How can I help you today? You can ask me to summarize notes, create a quiz, build a study plan, and much more.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newMessages: ChatMessageProps[] = [
      ...messages,
      {
        role: 'user',
        text: input,
        userAvatar: user?.photoURL,
        userName: user?.displayName || user?.email || 'User',
      },
    ];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // In a real app, you would call the AI here.
    // For now, we can add a placeholder response.
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { role: 'model', text: 'This is a placeholder response. In a real application, I would process your request.' },
      ]);
      setIsLoading(false);
    }, 1500);
  };

  useEffect(() => {
    const scrollableView = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
    if (scrollableView) {
      scrollableView.scrollTo({ top: scrollableView.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenuButton className="w-full justify-start" variant="outline">
            <Plus className="mr-2" /> New Chat
          </SidebarMenuButton>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {/* Placeholder for past conversations */}
            <p className="px-2 text-xs text-muted-foreground mb-2">Recent</p>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Summary of Biology Notes" isActive>
                <MessageSquare />
                <span>Summary of Biology Notes</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="History Quiz Prep">
                <MessageSquare />
                <span>History Quiz Prep</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          {user ? (
            <Link href="/dashboard" className="w-full">
              <SidebarMenuButton className="w-full justify-start">
                  <Avatar className="h-7 w-7">
                    <AvatarImage
                      src={user.photoURL || undefined}
                      data-ai-hint="person"
                    />
                    <AvatarFallback>
                      {user.displayName?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user.displayName || user.email}</span>
              </SidebarMenuButton>
            </Link>
          ) : (
            <Button asChild className="w-full">
              <Link href="/login">Login / Sign Up</Link>
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-[100dvh]">
          <header className="p-2 border-b flex items-center gap-2 md:hidden sticky top-0 bg-background z-10">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
                <Logo className="h-6 w-6" />
                <span className="font-bold font-headline">FocusFlow AI</span>
            </div>
          </header>
          <div className="flex-grow relative">
            <ScrollArea className="absolute inset-0" ref={scrollAreaRef}>
              <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
                {messages.length <= 1 && !isMobile ? (
                  <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
                    <Logo className="h-16 w-16 mb-4" />
                    <h1 className="text-2xl font-bold font-headline">
                      How can I help you today?
                    </h1>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <ChatMessage key={index} {...msg} />
                  ))
                )}
                 {isLoading && <ChatMessage role="model" text={<div className="h-5 w-5 border-2 rounded-full border-t-transparent animate-spin"></div>} />}
              </div>
            </ScrollArea>
          </div>

          <div className="p-4 bg-background/95 w-full">
            <div className="max-w-4xl mx-auto">
                <form
                  onSubmit={handleSendMessage}
                  className="relative flex items-end gap-2"
                >
                  <Textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask me anything, or type 'summarize these notes...'"
                    className="min-h-[44px] max-h-48 resize-y pr-12"
                    rows={1}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="absolute right-1 bottom-1 h-8 w-8"
                    disabled={!input.trim() || isLoading}
                  >
                    <Send />
                    <span className="sr-only">Send message</span>
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground text-center mt-2 px-2">
                    FocusFlow AI can make mistakes. Check important info.
                </p>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
