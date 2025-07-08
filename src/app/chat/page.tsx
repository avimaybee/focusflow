
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
import { Send, Plus, MessageSquare, Bot, GraduationCap, Sparkles } from 'lucide-react';
import { ChatMessage, ChatMessageProps } from '@/components/chat-message';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { chat, ChatInput, Persona } from '@/ai/flows/chat-flow';
import { updateUserPersona } from '@/lib/user-actions';


const personas = [
  {
    id: 'neutral',
    name: 'Neutral Assistant',
    icon: <Bot className="h-5 w-5" />,
    initialMessage: "Hello! I'm your AI study partner. How can I help you today? You can ask me to summarize notes, create a quiz, build a study plan, and much more.",
  },
  {
    id: 'tutor',
    name: 'Academic Tutor',
    icon: <GraduationCap className="h-5 w-5" />,
    initialMessage: "Greetings! I am your Academic Tutor. I can help you with in-depth explanations, create challenging quizzes, and guide you through complex subjects. What shall we tackle first?",
  },
  {
    id: 'creative',
    name: 'Creative Coach',
    icon: <Sparkles className="h-5 w-5" />,
    initialMessage: "Ready for some inspiration? As your Creative Coach, I can help you brainstorm ideas, create memory aids, and find new ways to approach your studies. Let's get creative!",
  }
];

export default function ChatPage() {
  const { user, preferredPersona } = useAuth();
  const isMobile = useIsMobile();
  const [selectedPersonaId, setSelectedPersonaId] = useState(personas[0].id);
  const selectedPersona = personas.find(p => p.id === selectedPersonaId)!;

  const [messages, setMessages] = useState<ChatMessageProps[]>([
    {
      role: 'model',
      text: selectedPersona.initialMessage,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // This effect syncs the component's state with the user's preference from the DB
  useEffect(() => {
    if (preferredPersona && personas.some(p => p.id === preferredPersona)) {
      setSelectedPersonaId(preferredPersona);
    }
  }, [preferredPersona]);

  // This effect updates the initial message and the DB when the persona changes
  useEffect(() => {
    // Only change initial message if it's the only message
    if (messages.length === 1 && messages[0].role === 'model') {
      const currentPersona = personas.find(p => p.id === selectedPersonaId)!;
      setMessages([{ role: 'model', text: currentPersona.initialMessage }]);
    }
    // Update preference in Firestore if user is logged in
    if (user?.uid) {
      updateUserPersona(user.uid, selectedPersonaId);
    }
  }, [selectedPersonaId, user?.uid]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userInput = input;
    const currentMessages: ChatMessageProps[] = [
      ...messages,
      {
        role: 'user',
        text: userInput,
        userAvatar: user?.photoURL,
        userName: user?.displayName || user?.email || 'User',
      },
    ];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistoryForAI = currentMessages
        .slice(1) // Remove initial welcome message
        .filter(m => typeof m.text === 'string') // Ensure we only send string messages
        .map(m => ({
          role: m.role,
          text: m.text as string,
        }));

      const chatInput: ChatInput = {
        message: userInput,
        persona: selectedPersonaId as Persona,
        history: chatHistoryForAI,
      };

      const result = await chat(chatInput);

      setMessages(prev => [
        ...prev,
        { role: 'model', text: result.response },
      ]);
    } catch (error) {
      console.error('Error calling chat AI:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: 'Sorry, something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const scrollableView = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
    if (scrollableView) {
      scrollableView.scrollTo({ top: scrollableView.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);
  
  // This effect handles auto-resizing the textarea.
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [input]);

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
          
          <div className="p-2 px-4 border-b flex items-center justify-between gap-2 bg-background z-10">
              <h2 className="font-bold font-headline text-sm md:text-base">New Chat</h2>
              <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
                  <SelectTrigger className="w-auto h-9 gap-2">
                      {selectedPersona.icon}
                      <SelectValue placeholder="Select Persona" />
                  </SelectTrigger>
                  <SelectContent>
                    {personas.map((persona) => (
                        <SelectItem key={persona.id} value={persona.id}>
                            <div className="flex items-center gap-2">
                                {persona.icon}
                                <span>{persona.name}</span>
                            </div>
                        </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
          </div>

          <div className="flex-grow relative">
            <ScrollArea className="absolute inset-0" ref={scrollAreaRef}>
              <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
                {messages.length <= 1 && !isMobile ? (
                  <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)] text-center">
                    <div className="p-4 rounded-full bg-primary/10 mb-4 border">
                      {selectedPersona.icon}
                    </div>
                    <h1 className="text-2xl font-bold font-headline">
                      {selectedPersona.name}
                    </h1>
                     <p className="text-muted-foreground mt-2 max-w-md">
                        {selectedPersona.initialMessage.split(' ')[0]} Start by typing a message below.
                    </p>
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
                  className="relative"
                >
                  <div className="flex items-end gap-2 p-2 rounded-xl border bg-muted/50 focus-within:ring-2 focus-within:ring-ring transition-shadow">
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask me anything..."
                        className="max-h-48 flex-1 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
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
                        className="h-8 w-8 shrink-0"
                        disabled={!input.trim() || isLoading}
                    >
                        <Send />
                        <span className="sr-only">Send message</span>
                    </Button>
                  </div>
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
