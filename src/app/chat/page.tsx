
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
import { Send, Plus, MessageSquare, Bot, Baby, Coffee, Sparkles, Filter, List, PenSquare, Lightbulb, Timer, Flame, Paperclip, X, File as FileIcon } from 'lucide-react';
import { ChatMessage, ChatMessageProps } from '@/components/chat-message';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { chat } from '@/ai/flows/chat-flow';
import { updateUserPersona } from '@/lib/user-actions';
import type { ChatInput, Persona } from '@/ai/flows/chat-types';
import { PromptLibrary } from '@/components/prompt-library';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

type Attachment = {
  preview: string; // URL for image previews, or name for other files
  data: string; // data URI for sending to AI
  type: string; // mime type
  name: string; // file name
};

const personas = [
  {
    id: 'neutral',
    name: 'Neutral Assistant',
    icon: <Bot className="h-5 w-5" />,
    initialMessage: "Hello! I'm your AI study partner. How can I help you today? You can ask me to summarize notes, create a quiz, build a study plan, and much more.",
    useCase: "Best for general questions, straightforward tasks, and when you need a reliable, no-frills AI assistant.",
  },
  { 
    id: 'five-year-old', 
    name: "Explain Like I'm 5", 
    icon: <Baby className="h-5 w-5" />, 
    initialMessage: "Hi there! I can explain big things using small, simple words. What do you want to learn about? It'll be super easy!",
    useCase: "Use this mode to break down complex, technical, or abstract topics into simple, easy-to-grasp concepts.",
  },
  { 
    id: 'casual', 
    name: 'Casual Conversationalist', 
    icon: <Coffee className="h-5 w-5" />, 
    initialMessage: "Hey! Let's just chat about what you're studying. No pressure, no lectures. What's on your mind?",
    useCase: "Ideal for low-pressure brainstorming, exploring ideas, or when you want to discuss a topic in a relaxed, friendly way.",
  },
  { 
    id: 'entertaining', 
    name: 'Entertaining Educator', 
    icon: <Sparkles className="h-5 w-5" />, 
    initialMessage: "Ready for a study session that's actually fun? I'll bring the jokes and pop culture refs. What topic are we making awesome today?",
    useCase: "Perfect for making dry or dense subjects more engaging. A great way to stay motivated and have fun while learning.",
  },
  { 
    id: 'brutally-honest', 
    name: 'Brutally Honest Mentor', 
    icon: <Filter className="h-5 w-5" />, 
    initialMessage: "Alright, no holding back. Show me what you've got, and I'll tell you what needs work. Prepare for some tough love.",
    useCase: "Use when you need direct, unfiltered feedback on your essays, arguments, or practice responses. No sugarcoating.",
  },
  { 
    id: 'straight-shooter', 
    name: 'Straight Shooter', 
    icon: <List className="h-5 w-5" />, 
    initialMessage: "Let's cut to the chase. No fluff, just facts and bullet points. What information do you need, right now?",
    useCase: "Best for when you need key information fast. Ask for summaries, definitions, or lists for concise, to-the-point answers.",
  },
  { 
    id: 'essay-sharpshooter', 
    name: 'Essay Sharpshooter', 
    icon: <PenSquare className="h-5 w-5" />, 
    initialMessage: "I am ready to assist with academic writing. I can help structure your arguments, refine your thesis, and outline your essay. What is your topic?",
    useCase: "Your go-to for any writing task. Use it for help with outlines, thesis statements, paragraph structure, and formal tone.",
  },
  { 
    id: 'idea-generator', 
    name: 'Idea Generator', 
    icon: <Lightbulb className="h-5 w-5" />, 
    initialMessage: "Feeling stuck? Let's brainstorm! I can help you generate creative ideas and explore new angles. What's our topic?",
    useCase: "Perfect for the start of a project. Use it to brainstorm essay topics, research questions, or creative solutions.",
  },
  { 
    id: 'cram-buddy', 
    name: 'Cram Buddy', 
    icon: <Timer className="h-5 w-5" />, 
    initialMessage: "Time is short, let's go! I'll give you the high-impact facts and memory aids you need to ace this. What subject are we cramming?",
    useCase: "For last-minute exam prep. It will deliver key facts, mnemonics, and high-yield information for rapid review.",
  },
  { 
    id: 'sassy', 
    name: 'Sassy Teaching Assistant', 
    icon: <Flame className="h-5 w-5" />, 
    initialMessage: "Ugh, fine, I'll help you study. Just try to keep up. What concept are we conquering today, genius?",
    useCase: "When you need a study break with a side of humor. Adds a witty, irreverent twist to explanations and answers.",
  },
];


export default function ChatPage() {
  const { user, preferredPersona } = useAuth();
  const { toast } = useToast();
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
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [personaPopoverOpen, setPersonaPopoverOpen] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    if ((!input.trim() && !attachment) || isLoading) return;

    const userInput = input;
    const userAttachment = attachment;

    const currentMessages: ChatMessageProps[] = [
      ...messages,
      {
        role: 'user',
        text: userInput,
        image: userAttachment?.type.startsWith('image/') ? userAttachment.preview : null,
        userAvatar: user?.photoURL,
        userName: user?.displayName || user?.email || 'User',
      },
    ];
    setMessages(currentMessages);
    setInput('');
    setAttachment(null);
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

      if (userAttachment) {
        if (userAttachment.type.startsWith('image/')) {
          chatInput.image = userAttachment.data;
        } else if (userAttachment.type === 'application/pdf') {
          chatInput.context = userAttachment.data;
        }
      }

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

  const handleSelectPrompt = (prompt: string) => {
    setInput(prompt);
    setIsHighlighting(true);
    setTimeout(() => setIsHighlighting(false), 300);

    // Use a timeout to ensure the state update has been processed and the DOM is updated
    // before we try to focus and set the selection.
    setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            
            // Logic to place cursor or select placeholder text
            const placeholderStart = prompt.indexOf('[');
            const placeholderEnd = prompt.indexOf(']');

            if (placeholderStart !== -1 && placeholderEnd !== -1) {
                // If there's a placeholder like [YOUR TOPIC HERE], select it.
                textareaRef.current.setSelectionRange(placeholderStart, placeholderEnd + 1);
            } else {
                // Otherwise, move the cursor to the end.
                const len = prompt.length;
                textareaRef.current.setSelectionRange(len, len);
            }
        }
    }, 0);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
          toast({
            variant: 'destructive',
            title: 'Unsupported File Type',
            description: 'Please upload an image or a PDF file.',
          });
          return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : file.name;
          setAttachment({
              preview: previewUrl,
              data: dataUrl,
              type: file.type,
              name: file.name,
          });
      };
      reader.readAsDataURL(file);
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
          <header className="p-2 border-b flex items-center gap-2 md:hidden sticky top-0 bg-[#1A1A1A] border-b border-[#2A2A2A] z-10">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
                <Logo className="h-6 w-6" />
                <span className="font-bold">FocusFlow AI</span>
            </div>
          </header>
          
          <div className="p-2 px-4 border-b flex items-center justify-between gap-2 bg-[#1A1A1A] border-b border-[#2A2A2A] z-10 h-14">
              <h2 className="font-bold text-sm md:text-base">New Chat</h2>
          </div>

          <div className="flex-grow relative">
            <ScrollArea className="absolute inset-0" ref={scrollAreaRef}>
              <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
                {messages.length <= 1 && !isMobile ? (
                  <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)] px-4 text-center">
                    <div className="p-4 rounded-full bg-primary/10 mb-4 border">
                      {selectedPersona.icon}
                    </div>
                    <h1 className="text-2xl font-bold">
                      {selectedPersona.name}
                    </h1>
                     <p className="text-muted-foreground mt-2 max-w-md">
                        {selectedPersona.initialMessage}
                    </p>
                    <div className="mt-6 max-w-md w-full text-left bg-muted/50 rounded-lg p-4">
                        <p className="font-bold text-sm text-foreground">Best for:</p>
                        <p className="text-muted-foreground text-sm mt-1">{selectedPersona.useCase}</p>
                    </div>
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
                {attachment && (
                    <div className="relative mb-2 w-full border rounded-md p-2 flex items-center gap-3">
                        {attachment.type.startsWith('image/') ? (
                           <Image src={attachment.preview} alt={attachment.name} width={40} height={40} className="object-contain rounded-md" />
                        ) : (
                           <FileIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                        <div className="flex-1 text-sm text-muted-foreground truncate">
                           {attachment.name}
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setAttachment(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <form
                  onSubmit={handleSendMessage}
                  className="relative"
                >
                  <div className="flex items-end gap-2 p-2 rounded-2xl bg-card shadow-lg focus-within:ring-2 focus-within:ring-ring transition-shadow">
                    <Popover open={personaPopoverOpen} onOpenChange={setPersonaPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0 rounded-full" aria-label="Select Persona">
                                {selectedPersona.icon}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 mb-2">
                            <div className="grid gap-4">
                                <div className="space-y-1">
                                    <h4 className="font-medium leading-none">Select a Study Mode</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Change the AI's tone and response style.
                                    </p>
                                </div>
                                <ScrollArea className="h-72 -mx-4">
                                    <div className="grid gap-1 px-4">
                                        {personas.map((persona) => (
                                            <button
                                                key={persona.id}
                                                className={cn(
                                                    'flex w-full cursor-pointer items-start gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted',
                                                    selectedPersonaId === persona.id && 'bg-muted'
                                                )}
                                                onClick={() => {
                                                    setSelectedPersonaId(persona.id as Persona);
                                                    setPersonaPopoverOpen(false);
                                                }}
                                            >
                                                <div className="p-2 bg-primary/10 rounded-md mt-1">
                                                    {persona.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold">{persona.name}</p>
                                                    <p className="text-xs text-muted-foreground">{persona.useCase}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <PromptLibrary
                      onSelectPrompt={handleSelectPrompt}
                    />
                    <Button type="button" variant="ghost" size="icon" className="h-12 w-12 shrink-0 rounded-full" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip />
                        <span className="sr-only">Attach file</span>
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" />
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask me anything..."
                        className={cn(
                            'max-h-48 flex-1 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 transition-colors duration-300 ease-in-out',
                            isHighlighting && 'bg-primary/10'
                        )}
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
                        className="h-12 w-12 shrink-0 rounded-full hover:scale-110 transition-transform"
                        disabled={(!input.trim() && !attachment) || isLoading}
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
