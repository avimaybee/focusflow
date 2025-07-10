
'use client';

import { useState, useRef, useEffect, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Logo } from '@/components/logo';
import { Send, MessageSquare, Bot as BotIcon, Baby, Coffee, Sparkles, Filter, List, PenSquare, Lightbulb, Timer, Flame, Paperclip, X, File as FileIcon, UploadCloud, Brain, Book, FileText, Bot as ToolsIcon, Plus, Settings, LogOut, User } from 'lucide-react';
import { ChatMessage, ChatMessageProps } from '@/components/chat-message';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { chat } from '@/ai/flows/chat-flow';
import { updateUserPersona } from '@/lib/user-actions';
import { Persona } from '@/ai/flows/chat-types';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { TextSelectionToolbar } from '@/components/text-selection-toolbar';
import { rewriteText } from '@/ai/flows/rewrite-text';
import { addCitations } from '@/ai/flows/add-citations';
import { generateBulletPoints } from '@/ai/flows/generate-bullet-points';
import { generateCounterarguments } from '@/ai/flows/generate-counterarguments';
import type { ChatInput } from '@/ai/flows/chat-types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PromptLibrary } from '@/components/prompt-library';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


type Attachment = {
  preview: string;
  data: string;
  type: string;
  name: string;
};

const personas = [
    { id: 'neutral', name: 'Neutral Assistant', icon: <BotIcon className="h-5 w-5" /> },
    { id: 'five-year-old', name: 'Patient Explainer', icon: <Baby className="h-5 w-5" /> },
    { id: 'casual', name: 'Casual Buddy', icon: <Coffee className="h-5 w-5" /> },
    { id: 'entertaining', name: 'Entertaining Educator', icon: <Sparkles className="h-5 w-5" /> },
    { id: 'brutally-honest', name: 'Honest Mentor', icon: <Filter className="h-5 w-5" /> },
    { id: 'straight-shooter', name: 'Straight Shooter', icon: <List className="h-5 w-5" /> },
    { id: 'essay-sharpshooter', name: 'Essay Sharpshooter', icon: <PenSquare className="h-5 w-5" /> },
    { id: 'idea-generator', name: 'Idea Generator', icon: <Lightbulb className="h-5 w-5" /> },
    { id: 'cram-buddy', name: 'Cram Buddy', icon: <Timer className="h-5 w-5" /> },
    { id: 'sassy', name: 'Sassy Assistant', icon: <Flame className="h-5 w-5" /> },
];


export default function ChatPage() {
  const { user, preferredPersona } = useAuth();
  const { toast } = useToast();
  const [selectedPersonaId, setSelectedPersonaId] = useState(personas[0].id);
  const selectedPersona = personas.find(p => p.id === selectedPersonaId)!;

  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [toolMenu, setToolMenu] = useState<{ text: string; rect: DOMRect } | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (preferredPersona && personas.some(p => p.id === preferredPersona)) {
      setSelectedPersonaId(preferredPersona);
    }
  }, [preferredPersona]);

  useEffect(() => {
    if (user?.uid) {
      updateUserPersona(user.uid, selectedPersonaId as Persona);
    }
  }, [selectedPersonaId, user?.uid]);


  const submitMessage = async (prompt: string, attachedFile: Attachment | null) => {
    if ((!prompt.trim() && !attachedFile) || isLoading) return;

    const userMessage: ChatMessageProps = {
      role: 'user',
      text: prompt,
      image: attachedFile?.type.startsWith('image/') ? attachedFile.preview : null,
      userAvatar: user?.photoURL,
      userName: user?.displayName || user?.email || 'User',
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const chatHistoryForAI = [...messages, userMessage]
        .filter(m => typeof m.text === 'string') 
        .map(m => ({
          role: m.role,
          text: m.text as string,
        }));

      const chatInput: ChatInput = {
        message: prompt,
        persona: selectedPersonaId as Persona,
        history: chatHistoryForAI,
      };

      if (attachedFile) {
        if (attachedFile.type.startsWith('image/')) {
          chatInput.image = attachedFile.data;
        } else {
          chatInput.context = attachedFile.data;
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
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitMessage(input, attachment);
    setInput('');
    setAttachment(null);
  };

  const handleSelectPrompt = (prompt: string) => {
     submitMessage(prompt, null);
  };
  
  const handleFileSelect = (file: File) => {
    if (!file) return;
  
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: 'Unsupported File Type',
        description: 'Please upload an image or a PDF file.',
      });
      return;
    }
  
    const maxSizeInBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: `Please upload a file smaller than ${
          maxSizeInBytes / 1024 / 1024
        }MB.`,
      });
      return;
    }
  
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const previewUrl = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : file.name;
      setAttachment({
        preview: previewUrl,
        data: dataUrl,
        type: file.type,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleShowTools = (messageText: string, targetElement: HTMLElement) => {
    if (toolMenu?.text === messageText) {
      setToolMenu(null);
    } else {
      setToolMenu({ text: messageText, rect: targetElement.getBoundingClientRect() });
    }
  };

  const handleToolAction = async (tool: { name: string; action: string; value: any; }) => {
    if (!toolMenu) return;
    const messageText = toolMenu.text;

    setToolMenu(null);

    if (tool.action === 'prompt') {
        const prompt = tool.value.replace('[SELECTED_TEXT]', messageText);
        await submitMessage(prompt, null);
    } 
    else if (tool.action === 'rewrite') {
        const userMessage: ChatMessageProps = {
            role: 'user',
            text: `${tool.name}: "${messageText.substring(0, 50)}..."`,
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const result = await rewriteText({
                textToRewrite: messageText,
                style: tool.value,
                persona: selectedPersonaId as Persona,
            });
            setMessages(prev => [
                ...prev,
                { role: 'model', text: result.rewrittenText },
            ]);
        } catch (error) {
            console.error('Error in rewrite action:', error);
            toast({
              variant: 'destructive',
              title: 'Rewrite Failed',
              description: 'Could not rewrite the text. Please try again.',
            });
            setMessages(prev => prev.slice(0, prev.length - 1));
        } finally {
            setIsLoading(false);
        }
    } else if (tool.action === 'addCitations') {
        const userMessage: ChatMessageProps = {
            role: 'user',
            text: `Add citations to: "${messageText.substring(0, 50)}..."`,
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const result = await addCitations({
                textToCite: messageText,
                citationStyle: tool.value, 
                persona: selectedPersonaId as Persona,
            });
            setMessages(prev => [
                ...prev,
                { role: 'model', text: result.citedText },
            ]);
        } catch (error) {
            console.error('Error in addCitations action:', error);
            toast({
              variant: 'destructive',
              title: 'Citation Failed',
              description: 'Could not add citations. Please try again.',
            });
            setMessages(prev => prev.slice(0, prev.length - 1));
        } finally {
            setIsLoading(false);
        }
    } else if (tool.action === 'bulletPoints') {
        const userMessage: ChatMessageProps = {
            role: 'user',
            text: `Convert to bullet points: "${messageText.substring(0, 50)}..."`,
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const result = await generateBulletPoints({
                textToConvert: messageText,
                persona: selectedPersonaId as Persona,
            });
            const formattedResult = result.bulletPoints.map(pt => `- ${pt}`).join('\n');
            setMessages(prev => [
                ...prev,
                { role: 'model', text: formattedResult },
            ]);
        } catch (error) {
            console.error('Error generating bullet points:', error);
            toast({
              variant: 'destructive',
              title: 'Transformation Failed',
              description: 'Could not convert to bullet points. Please try again.',
            });
            setMessages(prev => prev.slice(0, prev.length - 1));
        } finally {
            setIsLoading(false);
        }
    } else if (tool.action === 'counterarguments') {
        const userMessage: ChatMessageProps = {
            role: 'user',
            text: `Find counterarguments for: "${messageText.substring(0, 50)}..."`,
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const result = await generateCounterarguments({
                statementToChallenge: messageText,
                persona: selectedPersonaId as Persona,
            });
            const formattedResult = result.counterarguments.map((arg, i) => `${i + 1}. ${arg}`).join('\n\n');
            setMessages(prev => [
                ...prev,
                { role: 'model', text: formattedResult },
            ]);
        } catch (error) {
            console.error('Error generating counterarguments:', error);
            toast({
              variant: 'destructive',
              title: 'Transformation Failed',
              description: 'Could not generate counterarguments. Please try again.',
            });
            setMessages(prev => prev.slice(0, prev.length - 1));
        } finally {
            setIsLoading(false);
        }
    }
  };


  useEffect(() => {
    const scrollableView = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
    if (scrollableView) {
      scrollableView.scrollTo({ top: scrollableView.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);
  
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [input]);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const initial = displayName?.charAt(0).toUpperCase() || 'U';

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-80 flex-col bg-secondary/30 p-4 hidden md:flex group/sidebar border-r border-border/60">
          <div className="flex items-center justify-between mb-4 mt-2">
            <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <Logo className="h-7 w-7" />
                FocusFlow AI
            </Link>
            <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4"/>
            </Button>
          </div>
          <ScrollArea className="flex-1 -mx-4">
              <div className="px-4 py-2 space-y-1">
                  <Button variant="secondary" className="w-full justify-start gap-2 font-semibold text-primary-foreground">
                       <MessageSquare className="h-4 w-4"/>
                      <span className="truncate">Summary of Biology Notes</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                      <MessageSquare className="h-4 w-4"/>
                      <span className="truncate">History Quiz Prep</span>
                  </Button>
              </div>
          </ScrollArea>
          <div className="py-2 mt-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-sm h-auto py-2 px-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage
                                src={user?.photoURL || undefined}
                                data-ai-hint="person"
                            />
                            <AvatarFallback>{initial}</AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                            <p className="font-semibold truncate">{displayName}</p>
                            <p className="text-xs text-muted-foreground">Free Plan</p>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" side="top" align="start">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem><User className="mr-2 h-4 w-4"/> Profile</DropdownMenuItem>
                    <DropdownMenuItem><Settings className="mr-2 h-4 w-4"/> Settings</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem><LogOut className="mr-2 h-4 w-4"/> Logout</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

          </div>
      </aside>

      {/* Main Content */}
      <main 
        className="flex-1 flex flex-col h-screen"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isDraggingOver && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in">
              <div className="flex flex-col items-center gap-4 text-white p-8 border-2 border-dashed border-white rounded-lg bg-black/20">
                <UploadCloud className="h-16 w-16" />
                <p className="text-lg font-semibold">Drop your file here</p>
              </div>
            </div>
        )}
        
        <header className="sticky top-0 z-10 h-16 px-6 flex justify-between items-center w-full border-b border-border/60 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Chat</h2>
            </div>
            <div className="flex items-center gap-2">
                {user ? (
                    <Button asChild size="sm">
                      <Link href="/dashboard">
                        <Sparkles className="h-4 w-4 mr-2"/>
                        Go Premium
                      </Link>
                    </Button>
                ) : (
                  <>
                    <Button variant="ghost" asChild>
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/login">
                        Sign Up
                      </Link>
                    </Button>
                  </>
                )}
              </div>
          </header>

        <div className="flex-1 relative">
          <ScrollArea className="absolute inset-0" ref={scrollAreaRef} onScroll={() => setToolMenu(null)}>
            <div className="p-4 md:p-6 space-y-8 max-w-3xl mx-auto">
              {!hasMessages ? (
                 <div className="flex flex-col items-center justify-center h-[calc(100vh-280px)] px-4">
                     <div className="p-4 bg-primary/10 rounded-full mb-4 border border-primary/20">
                        <Logo className="h-10 w-10 text-primary"/>
                     </div>
                     <h1 className="text-2xl font-bold mb-2 text-center">
                        How can I help you today?
                     </h1>
                     <p className="text-muted-foreground mb-8">Select a prompt to get started.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                        <Button variant="outline" className="h-auto p-4 justify-start hover:-translate-y-1 transition-transform group hover:bg-accent hover:text-accent-foreground" onClick={() => handleSelectPrompt('Summarize this document for me...')}>
                           <div className="flex items-start text-left w-full gap-3">
                              <div className="p-2 bg-primary/10 rounded-md">
                                <FileText className="h-5 w-5 text-primary group-hover:text-accent-foreground"/>
                              </div>
                              <div className="w-full">
                                <p className="font-semibold text-base group-hover:text-accent-foreground">Summarize a document</p>
                                <p className="text-sm text-muted-foreground font-normal group-hover:text-accent-foreground">Condense any text or PDF.</p>
                              </div>
                           </div>
                        </Button>
                        <Button variant="outline" className="h-auto p-4 justify-start hover:-translate-y-1 transition-transform group hover:bg-accent hover:text-accent-foreground" onClick={() => handleSelectPrompt('Create a study plan for my history exam')}>
                           <div className="flex items-start text-left w-full gap-3">
                              <div className="p-2 bg-primary/10 rounded-md">
                                <Book className="h-5 w-5 text-primary group-hover:text-accent-foreground"/>
                              </div>
                              <div className="w-full">
                                <p className="font-semibold text-base group-hover:text-accent-foreground">Create a study plan</p>
                                <p className="text-sm text-muted-foreground font-normal group-hover:text-accent-foreground">Generate a weekly schedule.</p>
                              </div>
                           </div>
                        </Button>
                        <Button variant="outline" className="h-auto p-4 justify-start hover:-translate-y-1 transition-transform group hover:bg-accent hover:text-accent-foreground" onClick={() => handleSelectPrompt('Help me brainstorm ideas for my essay on climate change')}>
                           <div className="flex items-start text-left w-full gap-3">
                              <div className="p-2 bg-primary/10 rounded-md">
                                <Brain className="h-5 w-5 text-primary group-hover:text-accent-foreground"/>
                              </div>
                              <div className="w-full">
                                <p className="font-semibold text-base group-hover:text-accent-foreground">Brainstorm ideas</p>
                                <p className="text-sm text-muted-foreground font-normal group-hover:text-accent-foreground">Get creative angles for any topic.</p>
                              </div>
                           </div>
                        </Button>
                        <Button variant="outline" className="h-auto p-4 justify-start hover:-translate-y-1 transition-transform group hover:bg-accent hover:text-accent-foreground" onClick={() => handleSelectPrompt('Can you explain quantum computing in simple terms?')}>
                           <div className="flex items-start text-left w-full gap-3">
                              <div className="p-2 bg-primary/10 rounded-md">
                                <Sparkles className="h-5 w-5 text-primary group-hover:text-accent-foreground"/>
                              </div>
                              <div className="w-full">
                                <p className="font-semibold text-base group-hover:text-accent-foreground">Explain a concept</p>
                                <p className="text-sm text-muted-foreground font-normal group-hover:text-accent-foreground">Break down complex topics.</p>
                              </div>
                           </div>
                        </Button>
                      </div>
                 </div>
              ) : (
                messages.map((msg, index) => (
                  <ChatMessage
                    key={index}
                    {...msg}
                    onShowTools={
                      msg.role === 'model' && typeof msg.text === 'string'
                        ? (target) => handleShowTools(msg.text as string, target)
                        : undefined
                    }
                  />
                ))
              )}
               {isLoading && <ChatMessage role="model" text={<div className="h-5 w-5 border-2 rounded-full border-t-transparent animate-spin"></div>} />}
            </div>
          </ScrollArea>
           <TextSelectionToolbar menuData={toolMenu} onAction={handleToolAction} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background">
          <div className="relative max-w-3xl mx-auto p-2 rounded-xl bg-card border border-border/60 shadow-lg">
             {attachment && (
              <div className="p-2">
                <div className="flex items-center gap-3 bg-muted p-2 rounded-md">
                   <FileIcon className="h-6 w-6 text-muted-foreground"/>
                   <span className="text-sm text-foreground truncate flex-1">{attachment.name}</span>
                   <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setAttachment(null)}>
                      <X className="h-4 w-4"/>
                   </Button>
                </div>
              </div>
            )}
            <div className="flex items-start p-2 gap-2">
              <Popover>
                  <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
                          <BotIcon className="h-5 w-5" />
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0 mb-2">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold">Select Persona</h3>
                      <p className="text-sm text-muted-foreground">Change the AI's personality and tone</p>
                    </div>
                    <div className="flex flex-col p-2 pt-0">
                      {personas.map((p) => (
                        <Button
                          key={p.id}
                          variant={selectedPersonaId === p.id ? 'secondary' : 'ghost'}
                          className="w-full justify-start"
                          onClick={() => setSelectedPersonaId(p.id)}
                        >
                          {p.icon}
                          <span className="ml-2">{p.name}</span>
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
              </Popover>

              <PromptLibrary onSelectPrompt={handleSelectPrompt} />

              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" 
                onClick={() => fileInputRef.current?.click()}
              >
                  <Paperclip className="h-5 w-5"/>
              </Button>
              <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])} className="hidden" accept="image/*,application/pdf" />

              <form onSubmit={handleSendMessage} className="flex-1 flex items-start gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Ask a follow-up..."
                  className="w-full resize-none bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 max-h-48"
                  rows={1}
                />
                <Button type="submit" disabled={isLoading || (!input.trim() && !attachment)} size="icon" className="h-8 w-8 shrink-0 rounded-full">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
