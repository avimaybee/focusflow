'use client';

import { useState, useRef, useEffect, useCallback, Fragment } from 'react';
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
import { MultimodalInput, type MultimodalInputHandle } from '@/components/chat/multimodal-input';
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

function ShortcutPill({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <Fragment key={`${key}-${index}`}>
            <kbd className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground">
              {key}
            </kbd>
            {index < keys.length - 1 && (
              <span className="text-[10px] text-muted-foreground/70">+</span>
            )}
          </Fragment>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function ShortcutLegend() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const platform = navigator.platform || navigator.userAgent;
    if (platform.toLowerCase().includes('mac')) {
      setIsMac(true);
    }
  }, []);

  const modifier = isMac ? '⌘' : 'Ctrl';

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-muted-foreground">
      <ShortcutPill keys={[modifier, 'Enter']} label="Send message" />
      <ShortcutPill keys={['Shift', 'Enter']} label="New line" />
      <ShortcutPill keys={[modifier, 'N']} label="New chat" />
      <ShortcutPill keys={[modifier, 'K']} label="Search chats" />
    </div>
  );
}

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

  const inputRef = useRef<MultimodalInputHandle | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const previousChatIdRef = useRef<string | null>(null);
  const messagesRef = useRef<ChatMessageProps[]>([]);
  const messageFetchControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    return () => {
      messageFetchControllerRef.current?.abort();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  const hasOptimisticMessages = useCallback((list: ChatMessageProps[]) => {
    return list.some((msg) => {
      const id = msg.id ?? '';
      return id.startsWith('user-') || id.startsWith('guest-ai-') || id.startsWith('err-');
    });
  }, []);

  const loadMessages = useCallback(async (chatId: string, attempt = 0) => {
    if (!chatId) return;

    messageFetchControllerRef.current?.abort();
    const controller = new AbortController();
    messageFetchControllerRef.current = controller;

    try {
      const accessToken = session?.access_token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const url = `/api/chat?sessionId=${chatId}` + (accessToken ? `&accessToken=${encodeURIComponent(accessToken)}` : '');
      const res = await fetch(url, { headers, signal: controller.signal });

      if (!res.ok) {
        const text = await res.text().catch(() => 'Could not read response body');
        console.error('Failed to load messages:', res.status, text);
        return;
      }

      const data = await res.json();
      const fetched = (Array.isArray(data) ? data : []) as ChatMessageProps[];
      let shouldRetry = false;

      setMessages((prev) => {
        if (activeChatIdRef.current !== chatId) {
          return prev;
        }

        if (fetched.length === 0) {
          if (attempt < 3 && (hasOptimisticMessages(prev) || (prev && prev.length > 0))) {
            shouldRetry = true;
            return prev;
          }
          return prev && prev.length > 0 ? prev : [];
        }

        const prevList = prev || [];
        const fetchedIds = new Set(fetched.map((msg) => msg.id));
        const hasMissingOptimistic = prevList.some((msg) => {
          const optimistic = (msg.id ?? '').startsWith('user-') || (msg.id ?? '').startsWith('guest-ai-') || (msg.id ?? '').startsWith('err-');
          return optimistic && msg.id && !fetchedIds.has(msg.id);
        });

        if ((hasMissingOptimistic || fetched.length < prevList.length) && attempt < 5) {
          shouldRetry = true;
          return prev;
        }

        return fetched;
      });

      if (!shouldRetry && retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (shouldRetry) {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => loadMessages(chatId, attempt + 1), 600);
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        return;
      }
      console.error('Error fetching messages:', err);

      if (hasOptimisticMessages(messagesRef.current) && attempt < 3) {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => loadMessages(chatId, attempt + 1), 800);
      }
    } finally {
      if (messageFetchControllerRef.current === controller) {
        messageFetchControllerRef.current = null;
      }
    }
  }, [session?.access_token, hasOptimisticMessages]);

  useEffect(() => {
    const chatId = params.chatId as string | undefined;
    if (chatId) {
      setActiveChatId(chatId);
    }
  }, [params.chatId]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      previousChatIdRef.current = null;
      return;
    }

    const previousChatId = previousChatIdRef.current;
    previousChatIdRef.current = activeChatId;

    if (isNewChat) {
      return;
    }

    if (previousChatId !== activeChatId && !hasOptimisticMessages(messagesRef.current)) {
      setMessages([]);
    }

    loadMessages(activeChatId);

    return () => {
      messageFetchControllerRef.current?.abort();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [activeChatId, isNewChat, loadMessages, hasOptimisticMessages]);

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

  const handleNewChat = useCallback(() => {
    setActiveChatId(null);
    setMessages([]);
    setGuestMessageCount(0);
    setIsNewChat(false);
    router.push('/chat');
  }, [router]);
  useEffect(() => {
    const handleGlobalShortcuts = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.shiftKey) return;

      if (event.key.toLowerCase() === 'n') {
        const target = event.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }

        event.preventDefault();
        handleNewChat();
        return;
      }

      if (event.key === 'Enter') {
        const composerHandle = inputRef.current;
        if (!composerHandle) return;

        const activeElement = document.activeElement as HTMLElement | null;
        const textarea = composerHandle.getTextarea();
        if (!textarea || activeElement !== textarea) return;

        event.preventDefault();
        composerHandle.submit();
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [handleNewChat]);

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
          // Move the user into the newly created chat route to keep layout in sync
          router.replace(`/chat/${newChatId}`);
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
      if (currentChatId) {
        loadMessages(currentChatId);
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
      setMessages(prev => ([...(prev || []), errorResponse]));
      setIsNewChat(false);
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
                onRefreshHistory={forceRefresh}
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
      onRefreshHistory={forceRefresh}
        />
      </div>

      <main className="flex-1 flex flex-col h-screen min-w-0">
        <ChatHeader
          personaName={selectedPersona?.displayName || selectedPersona?.name || 'Default'}
          personaDescription={selectedPersona?.description}
          personaAvatar={selectedPersona?.avatarUrl}
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
            inputRef.current?.setDraft(prompt);
            inputRef.current?.focus();
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
              <ShortcutLegend />
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