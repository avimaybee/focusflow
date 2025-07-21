
'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { useToast } from '@/hooks/use-toast';
import { usePersonaManager } from '@/hooks/use-persona-manager';
import { useChatHistory } from '@/hooks/use-chat-history';
import { Attachment } from '@/hooks/use-file-upload';
import { useContextHubStore } from '@/stores/use-context-hub-store';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageList } from '@/components/chat/message-list';
import { MultimodalInput } from '@/components/chat/multimodal-input';
import { ContextHub } from '@/components/chat/context-hub';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChatMessageProps } from '@/components/chat-message';
import { AnnouncementBanner } from '@/components/announcement-banner';
import { marked } from 'marked';
import { deleteChat } from '@/lib/content-actions';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent } from '@/components/ui/sheet';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';

const GUEST_MESSAGE_LIMIT = 10;

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const { onOpen: openAuthModal } = useAuthModal();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const isMobile = useIsMobile();

  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  
  const [guestMessageCount, setGuestMessageCount] = useState(0);

  const { personas, selectedPersona, selectedPersonaId, setSelectedPersonaId } = usePersonaManager();
  const { chatHistory, isLoading: isHistoryLoading, forceRefresh } = useChatHistory();
  const { isContextHubOpen, toggleContextHub, closeContextHub } = useContextHubStore();

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chatIdFromUrl = params.chatId as string | undefined;
    if (chatIdFromUrl) {
      if (chatIdFromUrl !== activeChatId) {
        setActiveChatId(chatIdFromUrl);
      }
    } else {
      if (activeChatId) {
        handleNewChat();
      }
    }
  }, [params.chatId, activeChatId]);

  useEffect(() => {
    if (!user || !activeChatId) {
        if (!user) {
            setMessages([]);
            setGuestMessageCount(0);
        }
        return;
    }
  
    const chatRef = doc(db, 'users', user.uid, 'chats', activeChatId);
    
    const unsubscribe = onSnapshot(chatRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const sessionData = docSnapshot.data();
        const history = sessionData.threads?.main || [];
        
        const chatMessagesPromises = history
          .filter((msg: any) => msg.role !== 'system')
          .map(async (msg: any, index: number) => {
            const textContent = msg.content?.find((p: any) => p.text)?.text || '';

            let toolCallOutput: any = {};
            if (msg.role === 'model' && msg.toolCalls?.length > 0) {
              const call = msg.toolCalls[0];
              if (call.output) {
                if (call.name === 'createFlashcardsTool') {
                  toolCallOutput.flashcards = call.output.flashcards;
                }
                if (call.name === 'createQuizTool') {
                  toolCallOutput.quiz = call.output.quiz;
                }
              }
            }
          
          const prevMessage = history[index - 1];
          const nextMessage = history[index + 1];

          return { 
            id: `${docSnapshot.id}-${index}`,
            role: msg.role,
            text: await marked.parse(textContent),
            rawText: textContent,
            source: msg.data?.source,
            confidence: msg.data?.confidence,
            createdAt: sessionData.updatedAt || Timestamp.now(),
            userName: msg.role === 'user' ? user.displayName : undefined,
            userAvatar: msg.role === 'user' ? user.photoURL : undefined,
            isFirstInGroup: !prevMessage || prevMessage.role !== msg.role,
            isLastInGroup: !nextMessage || nextMessage.role !== msg.role,
            ...toolCallOutput,
          } as ChatMessageProps;
        });

        const resolvedMessages = await Promise.all(chatMessagesPromises);
        setMessages(resolvedMessages);
      } else {
        setMessages([]);
      }
    }, (error) => {
      console.error("Error fetching chat document:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load chat session.' });
    });
    
    return () => unsubscribe();
  }, [activeChatId, user, toast]);

  useEffect(() => {
    if (scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')) {
      const scrollableView = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')!;
      scrollableView.scrollTo({ top: scrollableView.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setGuestMessageCount(0);
    router.push('/chat');
  };

  const handleDeleteChat = async (chatId: string) => {
    setChatToDelete(chatId);
    setDialogOpen(true);
  };

  const confirmDeleteChat = async () => {
    if (!user || !chatToDelete) return;

    try {
        await deleteChat(user.uid, chatToDelete);
        forceRefresh();
        if (activeChatId === chatToDelete) {
            router.push('/chat');
        }
        toast({
            title: 'Chat Deleted',
            description: 'The chat session has been permanently deleted.',
        });
    } catch (error) {
        console.error('Failed to delete chat:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not delete the chat session.',
        });
    } finally {
        setDialogOpen(false);
        setChatToDelete(null);
    }
  };

  const handleRegenerate = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage && lastUserMessage.rawText) {
      setMessages(prev => prev.slice(0, -1));
      handleSendMessage({ input: lastUserMessage.rawText, attachments: lastUserMessage.attachments || [] });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not find a previous prompt to regenerate.' });
    }
  };

  const handleSendMessage = async ({ input, attachments }: { input: string; attachments: Attachment[] }) => {
    if (!input.trim() && attachments.length === 0 || isSending || authLoading ) return;

    if (!user) {
        if (guestMessageCount >= GUEST_MESSAGE_LIMIT) {
            openAuthModal('signup');
            toast({ title: 'Message Limit Reached', description: 'Please sign up or log in to continue chatting.' });
            return;
        }
    }

    setIsSending(true);

    const userMessage: ChatMessageProps = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: await marked.parse(input.trim()),
        rawText: input.trim(),
        userName: user?.displayName || 'Guest',
        userAvatar: user?.photoURL || null,
        createdAt: Timestamp.now(),
        attachments: attachments.map(att => ({ url: att.url, name: att.name, contentType: att.type, size: att.size }))
    };
    setMessages(prev => [...prev, userMessage]);

    if (!user) {
        setGuestMessageCount(prev => prev + 1);
    }
  
    const chatInput = {
      message: input.trim(),
      sessionId: user ? activeChatId || undefined : undefined,
      personaId: selectedPersonaId,
      context: attachments.length > 0 ? { url: attachments[0].url, filename: attachments[0].name } : undefined,
    };
  
    setInput('');
    setAttachments([]);
  
    try {
      const idToken = await user?.getIdToken();
      const headers: { [key:string]: string } = { 'Content-Type': 'application/json' };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(chatInput),
      });
  
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Received non-JSON response from server: ${text}`);
      }

      const result = await response.json();
      
      if (!response.ok) {
        throw { response, result };
      }
      
      if (user && result.sessionId && !activeChatId) {
        router.push(`/chat/${result.sessionId}`);
        forceRefresh();
      } else if (!user) {
        const modelResponse: ChatMessageProps = {
            id: `guest-ai-${Date.now()}`,
            role: 'model',
            text: await marked.parse(result.response),
            rawText: result.response,
            flashcards: result.flashcards,
            quiz: result.quiz,
            source: result.source,
            confidence: result.confidence,
            persona: selectedPersona || undefined,
            createdAt: Timestamp.now(),
        };
        setMessages(prev => [...prev, modelResponse]);
      }
    } catch (error: any) {
      console.error("Client-side send message error:", error);
      const description = error.result?.error || error.message || 'An unknown error occurred.';

      if (description.includes('You have reached your monthly limit')) {
        setUpgradeModalOpen(true);
      }

      toast({
        variant: 'destructive',
        title: 'Message Failed',
        description: description,
      });
  
      const errorResponse: ChatMessageProps = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `<p>Sorry, there was an error. Please try again.</p>`,
        rawText: `Sorry, there was an error. Please try again.`,
        isError: true,
        createdAt: Timestamp.now(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-secondary/30 text-foreground">
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-80 md:hidden">
          <ChatSidebar
            user={user}
            chatHistory={chatHistory}
            activeChatId={activeChatId}
            onNewChat={handleNewChat}
            onChatSelect={(id) => {
              router.push(`/chat/${id}`);
              setSidebarOpen(false);
            }}
            onDeleteChat={handleDeleteChat}
            isLoading={isHistoryLoading}
            isCollapsed={false}
            onToggle={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>
      
      <div className="hidden md:flex">
        <ChatSidebar
            user={user}
            chatHistory={chatHistory}
            activeChatId={activeChatId}
            onNewChat={handleNewChat}
            onChatSelect={(id) => router.push(`/chat/${id}`)}
            onDeleteChat={handleDeleteChat}
            isLoading={isHistoryLoading}
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      </div>

      <main className="flex-1 flex flex-col h-screen min-w-0">
        <ChatHeader
          personaName={selectedPersona?.name || 'Default'}
          onSidebarToggle={() => setSidebarOpen(true)}
          isLoggedIn={!!user}
        />
        
        <AnnouncementBanner />

        <MessageList
          messages={messages}
          isSending={isSending}
          isHistoryLoading={isHistoryLoading && !!activeChatId}
          activeChatId={activeChatId}
          activePersona={selectedPersona}
          scrollAreaRef={scrollAreaRef}
          onSmartToolAction={(prompt) => {
            handleSendMessage({ input: prompt, attachments: [] });
          }}
          onRegenerate={handleRegenerate}
        />

        <div className="w-full bg-background/50 backdrop-blur-sm">
            <div className="w-full sm:max-w-3xl mx-auto px-4 pb-4">
              <MultimodalInput
                chatId={activeChatId || 'new'}
                messages={messages.map(msg => ({ id: msg.id || '', content: msg.rawText || '', role: msg.role }))}
                attachments={attachments}
                setAttachments={setAttachments}
                onSendMessage={handleSendMessage}
                onStopGenerating={() => setIsSending(false)} // Assuming a stop generating function might be needed
                isGenerating={isSending}
                canSend={!isSending && !authLoading}
                selectedVisibilityType="private" // Or determine based on user settings
                personas={personas}
                selectedPersonaId={selectedPersonaId}
                setSelectedPersonaId={setSelectedPersonaId}
              />
            </div>
        </div>
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the chat session.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteChat}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Upgrade to Premium</AlertDialogTitle>
                    <AlertDialogDescription>
                        You've reached your monthly usage limit for this feature. Please upgrade to Premium for unlimited access.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Link href="/premium">Upgrade</Link>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </main>
      
      {/* Desktop Notes Sidebar */}
      <AnimatePresence>
        {!isMobile && isContextHubOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="hidden lg:flex flex-col bg-secondary/30 border-l border-border/50 h-screen overflow-hidden"
          >
            <ContextHub />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Notes Bottom Sheet */}
      {isMobile && (
        <Sheet open={isContextHubOpen && !!user} onOpenChange={toggleContextHub}>
            <SheetContent side="bottom" className="h-[60dvh] flex flex-col p-0">
                <ContextHub />
            </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
