'use client';

import { useState, useRef, useEffect } from 'react';
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
// Server functions moved to API routes to avoid importing server-only code into client bundle
// We'll call the new API endpoints instead
// import { getChatMessages, createChatSession, addChatMessage } from '@/lib/chat-actions';

const GUEST_MESSAGE_LIMIT = 10;

export default function ChatPage() {
  const { user, session, loading: authLoading } = useAuth();
  const { onOpen: openAuthModal } = useAuthModal();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const isMobile = useIsMobile();

  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isNewChat, setIsNewChat] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
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
    const chatId = params.chatId as string | undefined;
    setActiveChatId(chatId || null);
    // Clear messages when switching chats to prevent showing stale data
    setMessages([]);
  }, [params.chatId]);

  useEffect(() => {
    async function loadMessages() {
      // Don't load messages when we're creating a new chat and adding messages locally
      if (isNewChat || !activeChatId) {
        return;
      }
      
      setIsLoadingMessages(true);
      try {
        // Prefer Authorization header when session is present
        const accessToken = session?.access_token;
        const url = `/api/chat?sessionId=${activeChatId}` + (accessToken ? `&accessToken=${encodeURIComponent(accessToken)}` : '');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          setMessages(Array.isArray(data) ? data : []);
        } else {
          const text = await res.text().catch(() => 'Could not read response body');
          console.error('Failed to load messages:', res.status, text);
          setMessages([]);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    }
    loadMessages();
  }, [activeChatId, session, isNewChat]);

  // Debug: log messages changes to help identify when messages becomes undefined or malformed
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('[ChatPage] messages changed, length:', Array.isArray(messages) ? messages.length : typeof messages, messages && messages.slice ? messages.slice(-5) : messages);
  }, [messages]);

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
    setIsNewChat(false);
    setIsLoadingMessages(false);
    router.push('/chat');
  };

  const handleDeleteChat = async (chatId: string) => {
    setChatToDelete(chatId);
    setDialogOpen(true);
  };

  const confirmDeleteChat = async () => {
    if (!chatToDelete || !user) return;

    try {
      const accessToken = session?.access_token;
      const url = `/api/chat/delete?chatId=${chatToDelete}&userId=${user.id}` + 
        (accessToken ? `&accessToken=${encodeURIComponent(accessToken)}` : '');
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const res = await fetch(url, { 
        method: 'DELETE',
        headers 
      });

      if (res.ok) {
        toast({ 
          title: 'Chat Deleted', 
          description: 'The conversation has been removed.' 
        });

        // If we deleted the active chat, go to a new chat
        if (chatToDelete === activeChatId) {
          handleNewChat();
        }

        // Refresh chat history
        forceRefresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ 
          title: 'Error', 
          description: data.error || 'Failed to delete chat',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to delete chat',
        variant: 'destructive'
      });
    } finally {
      setDialogOpen(false);
      setChatToDelete(null);
    }
  };

  const handleRegenerate = () => {
    toast({ title: 'Coming Soon', description: 'Message regeneration will be re-enabled soon.' });
  };

  const handleSendMessage = async ({ input, attachments }: { input: string; attachments: Attachment[] }) => {
    // Prevent sending if no content, already sending, or auth is loading
    if ((!input.trim() && attachments.length === 0) || isSending || authLoading) return;

    if (!user) {
        openAuthModal();
        return;
    }

    setIsSending(true);

    let currentChatId = activeChatId;

    // Create a new chat session if it's the first message
    if (!currentChatId) {
        try {
          // Get the access token from the session
          const accessToken = session?.access_token;
          if (!accessToken) {
            console.error('[Client] No access token available in session');
            toast({ variant: 'destructive', title: 'Error', description: 'Authentication error. Please sign in again.' });
            setIsSending(false);
            return;
          }

          console.debug('[Client] Creating session - POST /api/chat/session', { userId: user.id, title: input.substring(0,30), hasToken: !!accessToken });
          const t0 = Date.now();
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
          const resp = await fetch('/api/chat/session', {
            method: 'POST',
            headers,
            body: JSON.stringify({ userId: user.id, title: input.substring(0, 30) }),
          });
          console.debug('[Client] session POST finished', { status: resp.status, durationMs: Date.now() - t0 });
          if (!resp.ok) {
            const text = await resp.text().catch(() => null);
            console.error('[Client] session creation failed', resp.status, text);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create a new chat session.' });
            setIsSending(false);
            return;
          }
          const data = await resp.json();
          const newChatId = data.id;
          currentChatId = newChatId;
          setIsNewChat(true); // Mark as new chat to prevent loading from DB
          setActiveChatId(newChatId);
          // Update URL without navigation to prevent page refresh
          window.history.replaceState(null, '', `/chat/${newChatId}`);
          forceRefresh();
        } catch (err) {
          console.error('Error creating chat session:', err);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not create a new chat session.' });
          setIsSending(false);
          return;
        }
    }

  const historyForAI = (messages || []).map(msg => ({ role: msg.role, text: msg.rawText || '' }));

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
    console.debug('[Client] Adding userMessage to messages', { id: userMessage.id, rawText: userMessage.rawText });
    setMessages(prev => {
      const next = ([...(prev || []), userMessage]);
      // eslint-disable-next-line no-console
      console.debug('[Client] messages length after user append:', next.length);
      return next;
    });
    // Save user message via API
  try {
  const accessToken = session?.access_token;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  await fetch('/api/chat/message', {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId: currentChatId, role: 'user', content: input.trim() }),
  });
    } catch (err) {
      console.error('Error saving user message via API:', err);
    }

    setGuestMessageCount(prev => prev + 1);
  
    const chatInput = {
      message: input.trim(),
      history: historyForAI,
      sessionId: currentChatId || undefined,
      personaId: selectedPersonaId,
      context: attachments.length > 0 ? { url: attachments[0].url, filename: attachments[0].name } : undefined,
    };
  
    setInput('');
    setAttachments([]);
  
    try {
      console.debug('[Client] POST /api/chat payload keys:', Object.keys(chatInput));
      const tstart = Date.now();
      const { authenticatedFetch } = await import('@/lib/auth-helpers');
      const response = await authenticatedFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify(chatInput),
      });
      console.debug('[Client] POST /api/chat responded', { status: response.status, durationMs: Date.now() - tstart });
  
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: any = null;
      try {
        result = await response.json();
      } catch (e) {
        const text = await response.text().catch(() => null);
        console.error('Could not parse JSON from /api/chat response:', text, e);
        throw { response };
      }
      if (!response.ok) {
        const bodyText = typeof result === 'string' ? result : JSON.stringify(result);
        console.error('/api/chat returned non-ok:', response.status, bodyText);
        throw { response, result };
      }
      
      const modelResponse: ChatMessageProps = {
          id: `guest-ai-${Date.now()}`,
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
  console.debug('[Client] Adding model response to messages', { id: modelResponse.id, rawText: modelResponse.rawText });
  setMessages(prev => {
    const next = ([...(prev || []), modelResponse]);
    // eslint-disable-next-line no-console
    console.debug('[Client] messages length after model append:', next.length);
    return next;
  });
      // Save model response via API
      try {
        const accessToken = session?.access_token;
        console.debug('[Client] Saving model message via POST /api/chat/message', { sessionId: currentChatId });
        const tmsg = Date.now();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        const r = await fetch('/api/chat/message', {
          method: 'POST',
          headers,
          body: JSON.stringify({ sessionId: currentChatId, role: 'model', content: result.response }),
        });
        console.debug('[Client] POST /api/chat/message finished', { status: r.status, durationMs: Date.now() - tmsg });
      } catch (err) {
        console.error('Error saving model message via API:', err);
      }
      // Refresh chat history to show the new chat in the sidebar
      forceRefresh();
      // Reset isNewChat flag now that messages are saved
      setIsNewChat(false);

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
  setMessages(prev => ([...(prev || []), errorResponse]));
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
                onDeleteChat={handleDeleteChat}
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
            onDeleteChat={handleDeleteChat}
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
          isHistoryLoading={isLoadingMessages}
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
                messages={(messages || []).map(msg => ({ id: msg.id || '', content: msg.rawText || '', role: msg.role }))}
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