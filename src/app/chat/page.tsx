
'use client';

import { useState, useRef, useEffect, DragEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Logo } from '@/components/logo';
import { Send, MessageSquare, Bot as BotIcon, Coffee, Sparkles, Filter, List, PenSquare, Lightbulb, Timer, Flame, Paperclip, X, File as FileIcon, UploadCloud, Brain, Book, FileText, Plus, Settings, LogOut, User, Loader2, Users } from 'lucide-react';
import { ChatMessage, ChatMessageProps } from '@/components/chat-message';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  chat,
  rewriteText,
  addCitations,
  generateBulletPoints,
  generateCounterarguments,
  generatePresentationOutline,
  highlightKeyInsights,
} from '@/ai/actions';
import { updateUserPersona } from '@/lib/user-actions';
import type { Persona } from '@/ai/flows/chat-types';
import { useToast } from '@/hooks/use-toast';
import { TextSelectionToolbar } from '@/components/text-selection-toolbar';
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
import { smartTools } from '@/components/smart-tools-menu';


import { uploadFile } from '@/lib/storage-actions';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, Timestamp, onSnapshot, doc } from 'firebase/firestore';


type Attachment = {
  name: string;
  type: string;
  // `data` will now hold the Firebase Storage URL, not a data URI
  data: string; 
  // `preview` is a local URL for client-side image previews
  preview: string;
};

interface ChatHistoryItem {
  id: string;
  title: string;
  createdAt: Timestamp;
}

const personas = [
    { id: 'neutral', name: 'Neutral Assistant', icon: <BotIcon className="h-5 w-5" />, description: "A straightforward, helpful AI assistant." },
    { id: 'casual', name: 'Casual Buddy', icon: <Coffee className="h-5 w-5" />, description: "Relaxed, peer-to-peer chat." },
    { id: 'entertaining', name: 'Entertaining Educator', icon: <Sparkles className="h-5 w-5" />, description: "Makes learning fun and engaging." },
    { id: 'brutally-honest', name: 'Honest Mentor', icon: <Filter className="h-5 w-5" />, description: "Sharp, direct, and critical feedback." },
    { id: 'straight-shooter', name: 'Straight Shooter', icon: <List className="h-5 w-5" />, description: "Clear, scannable, and actionable takeaways." },
    { id: 'essay-sharpshooter', name: 'Essay Sharpshooter', icon: <PenSquare className="h-5 w-5" />, description: "Scholarly and precise writing analysis." },
    { id: 'idea-generator', name: 'Idea Generator', icon: <Lightbulb className="h-5 w-5" />, description: "Expansive and imaginative brainstorming." },
    { id: 'cram-buddy', name: 'Cram Buddy', icon: <Timer className="h-5 w-5" />, description: "Urgent, high-impact exam prep." },
    { id: 'sassy', name: 'Sassy Assistant', icon: <Flame className="h-5 w-5" />, description: "Witty, irreverent, and informative." },
];


export default function ChatPage() {
  const { user, isPremium, preferredPersona, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState(personas[0].id);
  const selectedPersona = personas.find(p => p.id === selectedPersonaId)!;

  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [toolMenu, setToolMenu] = useState<{ text: string; rect: DOMRect } | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Set active chat from URL
  useEffect(() => {
    const chatIdFromParams = params.chatId as string | undefined;
    setActiveChatId(chatIdFromParams || null);
  }, [params]);

  // Load chat history list
  useEffect(() => {
    if (user?.uid) {
      const chatsRef = collection(db, 'users', user.uid, 'chats');
      const q = query(chatsRef, orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const history = querySnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
          createdAt: doc.data().createdAt,
        }));
        setChatHistory(history);
      });
      return () => unsubscribe();
    }
  }, [user?.uid]);


  // Load messages for the active chat
  useEffect(() => {
    if (user?.uid && activeChatId) {
      setIsHistoryLoading(true);
      const messagesRef = collection(db, 'users', user.uid, 'chats', activeChatId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const chatMessages = querySnapshot.docs.map(doc => {
            const data = doc.data();
            try {
              const parsedText = JSON.parse(data.text);
              return {
                id: doc.id,
                role: data.role,
                ...parsedText,
                createdAt: data.createdAt,
              };
            } catch (e) {
              return {
                id: doc.id,
                role: data.role,
                text: data.text,
                createdAt: data.createdAt,
              };
            }
        });
        setMessages(chatMessages);
        setIsHistoryLoading(false);
      }, (error) => {
        console.error("Error fetching messages:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load chat messages.' });
        setIsHistoryLoading(false);
      });

      return () => unsubscribe();
    } else {
      setMessages([]);
      setIsHistoryLoading(false);
    }
  }, [user?.uid, activeChatId, toast]);


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


  const submitMessage = async (prompt: string, attachedFiles: Attachment[]) => {
    if ((!prompt.trim() && attachedFiles.length === 0) || isLoading || !user?.uid) return;

    const userMessageText = prompt;
    const userMessage: ChatMessageProps = {
      role: 'user',
      text: userMessageText,
      images: attachedFiles.filter(f => f.type.startsWith('image/')).map(f => f.preview),
      userAvatar: user?.photoURL,
      userName: user?.displayName || user?.email || 'User',
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');
    setAttachments([]);

    let currentChatId = activeChatId;

    try {
      if (!currentChatId) {
        const chatDoc = await addDoc(collection(db, 'users', user.uid, 'chats'), {
          title: userMessageText.substring(0, 40),
          createdAt: serverTimestamp(),
        });
        currentChatId = chatDoc.id;
        setActiveChatId(chatDoc.id);
        router.push(`/chat/${chatDoc.id}`, { scroll: false });
      }

      await addDoc(collection(db, 'users', user.uid, 'chats', currentChatId, 'messages'), {
        role: 'user',
        text: userMessageText,
        createdAt: serverTimestamp(),
      });


      const chatHistoryForAI = [...messages, userMessage]
        .filter(m => typeof m.text === 'string') 
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text as string }],
        }));

      const finalAttachments = attachedFiles.map(a => a.data);
      const chatInput: ChatInput = {
        message: prompt,
        persona: selectedPersonaId as Persona,
        history: chatHistoryForAI,
        isPremium: isPremium,
        context: finalAttachments.find(a => a.includes('.pdf')),
        image: finalAttachments.find(a => a.includes('.png') || a.includes('.jpg') || a.includes('.jpeg') || a.includes('.webp')),
      };

      const result = await chat(chatInput);

      let messageContent: ChatMessageProps = { role: 'model', text: result.response };
      try {
        const parsedResponse = JSON.parse(result.response);
        if (parsedResponse.flashcards) {
          messageContent = { role: 'model', text: 'Here are your flashcards!', flashcards: parsedResponse.flashcards };
        } else if (parsedResponse.quiz) {
          messageContent = { role: 'model', text: 'Here is your quiz!', quiz: parsedResponse.quiz };
        }
      } catch (e) {
        // Not a JSON object, treat as plain text.
      }
      
      await addDoc(collection(db, 'users', user.uid, 'chats', currentChatId, 'messages'), {
        role: 'model',
        text: JSON.stringify(messageContent),
        createdAt: serverTimestamp(),
      });

    } catch (error) {
      console.error('Error in submitMessage:', error);
      toast({
        variant: 'destructive',
        title: 'Message Failed',
        description: 'Could not send message. Please try again.',
      });
      setMessages(prev => prev.slice(0, prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitMessage(input, attachments);
  };

  const handleSelectPrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    router.push('/chat');
  };
  
  const handleFileSelect = (file: File) => {
    if (!file || !user?.uid) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: 'Unsupported File Type',
        description: 'Please upload an image or a PDF file.',
      });
      return;
    }
  
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: `Please upload a file smaller than 10MB.`,
      });
      return;
    }

    const { id: toastId } = toast({
      title: 'Uploading...',
      description: `Your file "${file.name}" is being uploaded.`,
    });

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      try {
        const downloadURL = await uploadFile(user.uid!, dataUrl, file.name);
        
        const previewUrl = file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : file.name;

        setAttachments(prev => [...prev, {
          preview: previewUrl,
          data: downloadURL,
          type: file.type,
          name: file.name,
        }]);

        toast({
          id: toastId,
          title: 'Upload Successful',
          description: `"${file.name}" is ready.`,
        });

      } catch (error) {
        console.error("File upload error:", error);
        toast({
          id: toastId,
          variant: 'destructive',
          title: 'Upload Failed',
          description: 'Could not upload your file. Please try again.',
        });
      }
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

  const handleSmartToolAction = async (tool: typeof smartTools[0], messageText: string) => {
    if (!user?.uid) return;

    let currentChatId = activeChatId;
    const userPrompt = `${tool.name}: "${messageText.substring(0, 50)}..."`

    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: userPrompt }]);

    try {
        if (!currentChatId) {
            const chatDoc = await addDoc(collection(db, 'users', user.uid, 'chats'), {
              title: userPrompt,
              createdAt: serverTimestamp(),
            });
            currentChatId = chatDoc.id;
            setActiveChatId(chatDoc.id);
            router.push(`/chat/${chatDoc.id}`, { scroll: false });
        }
        
        await addDoc(collection(db, 'users', user.uid, 'chats', currentChatId, 'messages'), {
          role: 'user', text: userPrompt, createdAt: serverTimestamp()
        });
        
        const sourceArg = { sourceText: messageText, persona: selectedPersonaId as Persona };
        let actionFn: Promise<any>;
        let formatResult: (result: any) => string;

        switch (tool.action) {
            case 'rewrite':
                actionFn = rewriteText({ ...sourceArg, style: tool.value });
                formatResult = (result) => result.rewrittenText;
                break;
            case 'bulletPoints':
                actionFn = generateBulletPoints(sourceArg);
                formatResult = (result) => result.bulletPoints.map((pt: string) => `- ${pt}`).join('\n');
                break;
            case 'counterarguments':
                actionFn = generateCounterarguments({ statementToChallenge: messageText, persona: selectedPersonaId as Persona });
                formatResult = (result) => result.counterarguments.map((arg: string, i: number) => `${i + 1}. ${arg}`).join('\n\n');
                break;
            case 'presentation':
                actionFn = generatePresentationOutline(sourceArg);
                formatResult = (result) => {
                    let outlineString = `## ${result.title}\n\n`;
                    result.slides.forEach((slide: any, index: number) => {
                        outlineString += `### **Slide ${index + 1}: ${slide.title}**\n`;
                        slide.bulletPoints.forEach((point: string) => {
                            outlineString += `- ${point}\n`;
                        });
                        outlineString += '\n';
                    });
                    return outlineString;
                };
                break;
            case 'insights':
                actionFn = highlightKeyInsights(sourceArg);
                formatResult = (result) => {
                    let insightsString = '### Key Insights\n\n';
                    result.insights.forEach((insight: string) => {
                        insightsString += `- ${insight}\n`;
                    });
                    return insightsString;
                };
                break;
            default:
              throw new Error("Invalid tool action");
        }
        
        const result = await actionFn;
        const formattedResult = formatResult(result);
        
        await addDoc(collection(db, 'users', user.uid, 'chats', currentChatId, 'messages'), {
          role: 'model', text: formattedResult, createdAt: serverTimestamp()
        });

    } catch (error) {
        console.error(`Error in ${tool.action} action:`, error);
        toast({
          variant: 'destructive',
          title: 'Action Failed',
          description: `Could not perform ${tool.name}. Please try again.`,
        });
        setMessages(prev => prev.slice(0, prev.length - 1));
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

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-80 flex-col bg-secondary/30 p-4 hidden md:flex group/sidebar border-r border-border/60">
          <div className="flex items-center justify-between mb-4 mt-2">
            <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <Logo className="h-7 w-7" />
                FocusFlow AI
            </Link>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNewChat}>
                <Plus className="h-4 w-4"/>
            </Button>
          </div>
          <ScrollArea className="flex-1 -mx-4">
              <div className="px-4 py-2 space-y-1">
                  {chatHistory.map(chat => (
                    <Button 
                      key={chat.id}
                      variant={activeChatId === chat.id ? "secondary" : "ghost"} 
                      className="w-full justify-start gap-2 font-normal hover:bg-muted/50 hover:text-foreground"
                      onClick={() => router.push(`/chat/${chat.id}`)}
                    >
                       <MessageSquare className="h-4 w-4 flex-shrink-0"/>
                      <span className="truncate">{chat.title}</span>
                  </Button>
                  ))}
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
              {isHistoryLoading ? (
                <div className="flex justify-center items-center h-[calc(100vh-280px)]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !activeChatId && !hasMessages ? (
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
                    onSmartToolAction={handleSmartToolAction}
                  />
                ))
              )}
               {isLoading && <ChatMessage role="model" text={<div className="h-5 w-5 border-2 rounded-full border-t-transparent animate-spin"></div>} />}
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background">
          <div className="relative max-w-3xl mx-auto p-2 rounded-xl bg-card border border-border/60 shadow-lg">
             {attachments.length > 0 && (
              <div className="p-2 border-b border-border/60">
                <div className="flex items-center gap-2 flex-wrap">
                  {attachments.map((att, index) => (
                    <div key={index} className="flex items-center gap-2 bg-muted p-1.5 rounded-md text-sm">
                       <FileIcon className="h-4 w-4 text-muted-foreground"/>
                       <span className="text-foreground truncate max-w-[120px]">{att.name}</span>
                       <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}>
                          <X className="h-3.5 w-3.5"/>
                       </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-start p-2 gap-2">
              <Popover>
                  <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
                          <Users className="h-5 w-5" />
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-80 p-2 mb-2">
                    <div className="p-2">
                      <h3 className="text-sm font-semibold">Select Persona</h3>
                      <p className="text-sm text-muted-foreground">Change the AI's personality and tone.</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {personas.map((p) => (
                        <Button
                          key={p.id}
                          variant={selectedPersonaId === p.id ? 'secondary' : 'ghost'}
                          className="w-full justify-start h-auto py-2 px-3"
                          onClick={() => setSelectedPersonaId(p.id)}
                        >
                          {p.icon}
                          <div className="ml-3 text-left">
                            <p className="font-semibold text-sm">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.description}</p>
                          </div>
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
                  placeholder={activeChatId ? "Ask a follow-up..." : "Start a new conversation..."}
                  className="w-full resize-none bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 max-h-48"
                  rows={1}
                  disabled={isHistoryLoading}
                />
                <Button type="submit" disabled={isLoading || (!input.trim() && attachments.length === 0) || isHistoryLoading} size="icon" className="h-8 w-8 shrink-0 rounded-full">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

    