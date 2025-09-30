'use client';

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { useToast } from '@/hooks/use-toast';
import { usePersonaManager } from '@/hooks/use-persona-manager';
import { useChatHistory } from '@/hooks/use-chat-history';
import { Attachment } from '@/types/chat-types';
import { useContextHubStore } from '@/stores/use-context-hub-store';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageList } from '@/components/chat/message-list';
import { MultimodalInput } from '@/components/chat/multimodal-input';
import { ContextHub } from '@/components/chat/context-hub';
import { ChatMessageProps } from '@/components/chat/chat-message';
import { AnnouncementBanner } from '@/components/announcement-banner';
import { marked } from 'marked';
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
import { supabase } from '@/lib/supabase';

const GUEST_MESSAGE_LIMIT = 10;

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const { onOpen: openAuthModal } = useAuthModal();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const isMobile = useIsMobile();

  const chatId = Array.isArray(params.chatId) ? params.chatId[0] : params.chatId;

  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(chatId || null);
  
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
  const { isContextHubOpen, toggleContextHub: baseToggleContextHub, closeContextHub } = useContextHubStore();

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setActiveChatId(chatId || null);
  }, [chatId]);

  const loadChatMessages = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const loadedMessages = await Promise.all(data.map(async (msg) => ({
        id: msg.id,
        role: msg.role,
        text: await marked.parse(msg.content),
        rawText: msg.content,
        createdAt: new Date(msg.created_at),
      })));
      setMessages(loadedMessages);
    } catch (error) {
      console.error("Error loading chat messages:", error);
      toast({
        variant: 'destructive',
        title: 'Failed to Load Chat',
        description: 'Could not load your chat messages. Please try again.',
      });
    }
  }, [user, toast]);

  useEffect(() => {
    if (activeChatId) {
      loadChatMessages(activeChatId);
    } else {
      setMessages([]);
    }
  }, [activeChatId, loadChatMessages]);

  const handleSetSidebarOpen = (isOpen: boolean) => {
    setSidebarOpen(isOpen);
  };

  const toggleContextHub = () => {
    baseToggleContextHub();
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setGuestMessageCount(0);
    router.push('/chat');
  };

  const handleDeleteChat = async (chatIdToDelete: string) => {
    if (!chatIdToDelete) return;

    try {
        const { error } = await supabase
            .from('chat_sessions')
            .delete()
            .eq('id', chatIdToDelete);

        if (error) throw error;

        toast({
            title: 'Chat Deleted',
            description: 'The chat session has been successfully deleted.',
        });

        if (activeChatId === chatIdToDelete) {
            handleNewChat();
        }
        forceRefresh(); // Refresh chat history
    } catch (error) {
        console.error('Error deleting chat:', error);
        toast({
            variant: 'destructive',
            title: 'Deletion Failed',
            description: 'Could not delete the chat session. Please try again.',
        });
    } finally {
        setDialogOpen(false);
        setChatToDelete(null);
    }
  };

  const confirmDeleteChat = async () => {
    if (chatToDelete) {
      handleDeleteChat(chatToDelete);
    }
  };

  const handleRegenerate = () => {
    toast({ title: 'Coming Soon', description: 'Message regeneration will be re-enabled soon.' });
  };

  const handleSendMessage = async ({ input, attachments }: { input: string; attachments: Attachment[] }) => {
    if ((!input.trim() && attachments.length === 0) || isSending || authLoading) return;

    setIsSending(true);

    let currentChatId = activeChatId;
    // Create a new session if one doesn't exist
    if (!currentChatId && user) {
        try {
            const { data, error } = await supabase
                .from('chat_sessions')
                .insert({ user_id: user.id, title: input.substring(0, 30) })
                .select('id')
                .single();

            if (error) throw error;

            currentChatId = data.id;
            setActiveChatId(data.id);
            router.push(`/chat/${data.id}`);
            forceRefresh();
        } catch (error) {
            console.error("Error creating new chat session:", error);
            toast({
                variant: 'destructive',
                title: 'Failed to Start Chat',
                description: 'Could not create a new chat session. Please try again.',
            });
            setIsSending(false);
            return;
        }
    }

    const userMessage: ChatMessageProps = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: await marked.parse(input.trim()),
        rawText: input.trim(),
        userName: user?.user_metadata?.displayName || user?.email || 'User',
        userAvatar: user?.user_metadata?.avatar_url || null,
        createdAt: new Date(),
        attachments: attachments.map(att => ({ url: att.url, name: att.name, contentType: att.contentType, size: att.size }))
    };
    setMessages(prev => [...prev, userMessage]);

    if (user && currentChatId) {
        const { error } = await supabase.from('chat_messages').insert({
            session_id: currentChatId,
            role: 'user',
            content: input.trim()
        });
        if (error) console.error("Error saving user message:", error);
    } else if (!user) {
      setGuestMessageCount(prev => prev + 1);
    }
  
    const chatInput = {
      message: input.trim(),
      history: messages.map(msg => ({ role: msg.role, text: msg.rawText || '' })),
      personaId: selectedPersonaId,
      context: attachments.length > 0 ? { url: attachments[0].url, filename: attachments[0].name } : undefined,
    };
  
    setInput('');
    setAttachments([]);
  
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatInput),
      });
  
      const result = await response.json();
      
      if (!response.ok) {
        throw { response, result };
      }
      
      const modelResponse: ChatMessageProps = {
          id: `ai-${Date.now()}`,
          role: 'model',
          text: await marked.parse(result.response),
          rawText: result.response,
          flashcards: result.flashcards,
          quiz: result.quiz,
          source: result.source,
          confidence: result.confidence,
          persona: selectedPersona,
          createdAt: new Date(),
      };
      setMessages(prev => [...prev, modelResponse]);

      if (user && currentChatId) {
          const { error } = await supabase.from('chat_messages').insert({
              session_id: currentChatId,
              role: 'model',
              content: result.response
          });
          if (error) console.error("Error saving model message:", error);
      }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Client-side send message error:", error);
      const description = error.result?.error || error.message || 'An unknown error occurred.';

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
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsSending(false);
    }
  };

  const handleFocusInput = () => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
    if (isContextHubOpen) {
      closeContextHub();
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-secondary/30 text-foreground">
      {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={handleSetSidebarOpen}>
            <SheetContent side="left" className="p-0 w-80">
              <ChatSidebar
                user={user}
                chatHistory={chatHistory}
                activeChatId={activeChatId}
                onNewChat={handleNewChat}
                onChatSelect={(id) => {
                  router.push(`/chat/${id}`);
                  setSidebarOpen(false);
                }}
                onDeleteChat={(id) => {
                  setChatToDelete(id);
                  setDialogOpen(true);
                }}
                isLoading={isHistoryLoading}
                isCollapsed={false}
                onToggle={() => handleSetSidebarOpen(false)}
              />
            </SheetContent>
          </Sheet>
      )}
      
      <div className="hidden md:flex">
        <ChatSidebar
            user={user}
            chatHistory={chatHistory}
            activeChatId={activeChatId}
            onNewChat={handleNewChat}
            onChatSelect={(id) => router.push(`/chat/${id}`)}
            onDeleteChat={(id) => {
              setChatToDelete(id);
              setDialogOpen(true);
            }}
            isLoading={isHistoryLoading}
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      </div>

      <main className="flex-1 flex flex-col h-screen min-w-0">
        <ChatHeader
          personaName={selectedPersona?.name || 'Default'}
          onSidebarToggle={() => handleSetSidebarOpen(true)}
          isLoggedIn={!!user}
          onNotesToggle={toggleContextHub}
        />
        
        <AnnouncementBanner />

        <MessageList
          messages={messages}
          isSending={isSending}
          isHistoryLoading={isHistoryLoading && !!activeChatId}
          activeChatId={activeChatId}
          activePersona={selectedPersona}
          onSmartToolAction={(prompt) => {
            handleSendMessage({ input: prompt, attachments: [] });
          }}
          onRegenerate={handleRegenerate}
        />

        <div className="w-full bg-background/50 backdrop-blur-sm sticky bottom-0">
            <div className="w-full sm:max-w-3xl mx-auto px-4 pb-4">
              <MultimodalInput
                ref={inputRef}
                chatId={activeChatId || 'new'}
                messages={messages.map(msg => ({ id: msg.id || '', content: msg.rawText || '', role: msg.role }))}
                attachments={attachments}
                setAttachments={setAttachments}
                onSendMessage={handleSendMessage}
                onStopGenerating={() => setIsSending(false)}
                onFocus={handleFocusInput}
                isGenerating={isSending}
                canSend={!isSending && !authLoading}
                selectedVisibilityType="private"
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
                        You&apos;ve reached your monthly usage limit for this feature. Please upgrade to Premium for unlimited access.
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
        {isContextHubOpen && !isMobile && (
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
        <Sheet open={isContextHubOpen} onOpenChange={baseToggleContextHub}>
            <SheetContent side="bottom" className="h-[60dvh] flex flex-col p-0">
                <ContextHub />
            </SheetContent>
        </Sheet>
      )}
    </div>
  );
}