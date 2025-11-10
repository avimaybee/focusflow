'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { useToast } from '@/hooks/use-toast';
import { usePersonaManager } from '@/hooks/use-persona-manager';
import { useChatHistory } from '@/hooks/use-chat-history';
import { Attachment, type PersonaDetails as ChatPersonaDetails } from '@/types/chat-types';
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
import { TooltipProvider } from '@/components/ui/tooltip';
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
  const [personaWasExplicitlySet, setPersonaWasExplicitlySet] = useState(false);
  const { chatHistory, isLoading: isHistoryLoading, forceRefresh } = useChatHistory();
  const { isContextHubOpen, toggleContextHub: baseToggleContextHub, closeContextHub } = useContextHubStore();

  const inputRef = useRef<MultimodalInputHandle | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const previousChatIdRef = useRef<string | null>(null);
  const messagesRef = useRef<ChatMessageProps[]>([]);
  const messageFetchControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstLoadRef = useRef<boolean>(true);
  const currentChatIdRef = useRef<string | null>(null);

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
      return id.startsWith('user-') || id.startsWith('model-') || id.startsWith('err-');
    });
  }, []);

  const loadMessages = useCallback(async (chatId: string, attempt = 0, isFirstLoad = false) => {
    if (!chatId) return;

    messageFetchControllerRef.current?.abort();
    const controller = new AbortController();
    messageFetchControllerRef.current = controller;

    console.debug('[Client] loadMessages called', {
      chatId,
      attempt,
      isFirstLoad,
      personaWasExplicitlySet,
      accessTokenPresent: !!session?.access_token,
    });

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

      // Only restore persona from chat history on initial load, and only if user didn't explicitly select one
      if (fetched.length > 0 && isFirstLoad && !personaWasExplicitlySet) {
        const lastUserPersona = [...fetched]
          .reverse()
          .find((msg) => msg.role === 'user' && typeof msg.personaId === 'string' && msg.personaId.length > 0);

        if (lastUserPersona?.personaId && lastUserPersona.personaId !== selectedPersonaId) {
          setSelectedPersonaId(lastUserPersona.personaId);
        }
      }

      console.debug('[Client] loadMessages fetched batch', {
        chatId,
        fetchedCount: fetched.length,
        attempt,
      });

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

        // If we fetched more messages than we had before, or if we have the same number
        // but we're loading after sending a message, replace all messages
        if (fetched.length >= prevList.length) {
          return fetched;
        }

        const hasMissingOptimistic = prevList.some((msg) => {
          const optimistic = (msg.id ?? '').startsWith('user-') || (msg.id ?? '').startsWith('model-') || (msg.id ?? '').startsWith('err-');
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
        console.debug('[Client] Scheduling retry for loadMessages', { chatId, nextAttempt: attempt + 1 });
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
        retryTimeoutRef.current = setTimeout(() => loadMessages(chatId, attempt + 1, isFirstLoad), 800);
        console.debug('[Client] Scheduling retry after error', { chatId, nextAttempt: attempt + 1 });
      }
    } finally {
      if (messageFetchControllerRef.current === controller) {
        messageFetchControllerRef.current = null;
      }
    }
  }, [session?.access_token, hasOptimisticMessages, selectedPersonaId, setSelectedPersonaId, personaWasExplicitlySet]);

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
      firstLoadRef.current = true;
      setPersonaWasExplicitlySet(false);
      return;
    }

    const previousChatId = previousChatIdRef.current;
    previousChatIdRef.current = activeChatId;

    if (isNewChat) {
      return;
    }

  if (previousChatId !== activeChatId && !hasOptimisticMessages(messagesRef.current) && !isSending) {
    setMessages([]);
  }    // Load messages on first load of this chat, but not if we have AI responses already
    const isFirstLoad = firstLoadRef.current;
    if (isFirstLoad) {
      firstLoadRef.current = false;
    }

    // Don't load messages if we have AI responses and we're not explicitly loading after sending
    const hasAIResponses = messagesRef.current.some(msg => msg.role === 'model');
    if (hasAIResponses && !isFirstLoad) {
      // Allow loading on first load even with AI responses (for navigation to existing chats)
      return;
    }

    loadMessages(activeChatId, 0, isFirstLoad);

    return () => {
      messageFetchControllerRef.current?.abort();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [activeChatId, isNewChat, loadMessages, hasOptimisticMessages]);

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
          // Ensure ref is in sync immediately so subsequent loadMessages
          // calls (which check activeChatIdRef.current) won't bail out
          // due to the ref still being the old value in the same tick.
          activeChatIdRef.current = newChatId;
          // Also keep currentChatIdRef in sync for any other usages
          currentChatIdRef.current = newChatId;
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

  const normalizedAttachments = attachments.map(att => ({
    url: att.url,
    remoteUrl: att.remoteUrl,
    name: att.name,
    contentType: att.contentType,
    size: att.size,
  }));

  const userMessage: ChatMessageProps = {
    id: `user-${Date.now()}`,
    role: 'user',
    text: await marked.parse(input.trim()),
    rawText: input.trim(),
    userName: user?.user_metadata?.displayName || user?.email || 'User',
    userAvatar: user?.user_metadata?.avatar_url || null,
    createdAt: new Date(),
    attachments: normalizedAttachments.length > 0 ? normalizedAttachments : undefined,
    personaId: selectedPersonaId,
    persona: selectedPersona || undefined,
  };
    console.debug('[Client] Adding userMessage to messages', { id: userMessage.id, rawText: userMessage.rawText });
    setMessages(prev => {
      const next = ([...(prev || []), userMessage]);
      // eslint-disable-next-line no-console
      console.debug('[Client] messages length after user append:', next.length);
      return next;
    });
    
    // NOTE: User message will be saved by the server in chat-flow.ts
    // This prevents duplicate saves and ensures proper ordering

    setGuestMessageCount(prev => prev + 1);
  
    // Convert attachments to API format
    const apiAttachments = attachments
      .map(att => ({
      type: 'file_uri' as const,
      data: att.remoteUrl ?? att.url,
      mimeType: att.contentType,
      name: att.name,
      sizeBytes: typeof att.size === 'number' ? att.size : Number(att.size || 0),
    }))
      .filter(att => typeof att.data === 'string' && att.data.length > 0);

    // DON'T pass history - let the server fetch full conversation from database
    // This ensures the AI has access to all previous messages, not just what's in client state
    const chatInput = {
      message: input.trim(),
      // history: removed - server will load from DB using sessionId
      sessionId: currentChatId || undefined,
      personaId: selectedPersonaId,
      attachments: apiAttachments.length > 0 ? apiAttachments : undefined,
    };
  
    console.debug('[Client] Prepared chat input payload', {
      sessionId: chatInput.sessionId,
      personaId: chatInput.personaId,
      attachmentCount: chatInput.attachments?.length ?? 0,
      messagePreview: chatInput.message.slice(0, 120),
    });

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

      const responsePersonaId = typeof result?.persona?.id === 'string'
        ? result.persona.id
        : selectedPersonaId;
      const personaFromState = personas.find((p) => p.id === responsePersonaId);
      const mappedPersona: ChatPersonaDetails | undefined = personaFromState || (result?.persona
        ? {
            id: result.persona.id,
            name: result.persona.name || result.persona.display_name || result.persona.id,
            avatarUrl: result.persona.avatar_url || '',
            avatarEmoji: result.persona.avatar_emoji || undefined,
            prompt: result.persona.prompt || '',
          }
        : selectedPersona || undefined);
      const autoSelection = result?.autoSelection;
      const autoSelectedPersonaId = typeof autoSelection?.personaId === 'string' ? autoSelection.personaId : undefined;
      const autoSelectedPersonaName = typeof autoSelection?.personaName === 'string' ? autoSelection.personaName : undefined;
      
      const modelResponse: ChatMessageProps = {
          id: `ai-${Date.now()}`,
          role: 'model',
          text: await marked.parse(result.response),
          rawText: result.response,
          flashcards: result.flashcards,
          quiz: result.quiz,
          source: result.source,
          confidence: result.confidence,
          persona: mappedPersona,
          personaId: responsePersonaId,
          createdAt: new Date(),
          selectedByAuto: Boolean(autoSelection),
          autoSelectedPersonaId,
          autoSelectedPersonaName,
      };

      console.log('[DEBUG] Created modelResponse:', { id: modelResponse.id, role: modelResponse.role, textLength: modelResponse.rawText?.length });
  console.debug('[Client] Adding AI response to messages', {
    id: modelResponse.id,
    rawText: (modelResponse.rawText || '').substring(0, 100) + '...',
    sessionId: currentChatId,
  });
      setMessages(prev => {
        const newMessages = [...(prev || []), modelResponse];
        return newMessages;
      });
      // Refresh chat history to show the new chat in the sidebar
      forceRefresh();
      // Reset isNewChat flag now that messages are saved
      setIsNewChat(false);
      // Immediately attempt to refresh messages from the DB so the saved AI
      // response (which may have been persisted server-side) is reflected in
      // the UI without requiring the user to refresh or send another message.
      // loadMessages will internally retry if optimistic messages are present
      // or if the saved messages haven't appeared yet.
      try {
        if (currentChatId) {
          // First, attempt to load messages via existing loader which contains
          // retry logic and optimistic-preservation behavior.
          await loadMessages(currentChatId);

          // Additionally, do a short polling loop to handle transient
          // eventual-consistency issues where the AI reply may not be
          // visible immediately from the DB. We fetch directly from the API
          // and replace messages once we detect a model reply.
          const maxAttempts = 6;
          const attemptDelayMs = 300;
          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
              if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
              const url = `/api/chat?sessionId=${currentChatId}` + (session?.access_token ? `&accessToken=${encodeURIComponent(session.access_token)}` : '');
              const res = await fetch(url, { headers });
              if (!res.ok) {
                console.debug('[Client] Poll fetch /api/chat failed', { status: res.status, attempt });
              } else {
                const data = await res.json();
                const fetched = Array.isArray(data) ? (data as ChatMessageProps[]) : [];
                const hasModel = fetched.some(m => m.role === 'model');
                if (hasModel) {
                  console.debug('[Client] Poll detected model reply, updating messages', { sessionId: currentChatId, attempt, fetchedCount: fetched.length });
                  setMessages(fetched);
                  break;
                }
              }
            } catch (pollErr) {
              console.debug('[Client] Poll attempt error', { attempt, error: pollErr });
            }

            // If not last attempt, wait a bit before trying again
            if (attempt < maxAttempts) {
              await new Promise((r) => setTimeout(r, attemptDelayMs));
            }
          }
        }
      } catch (e) {
        // swallow - this polling is best-effort and non-blocking
        console.debug('[Client] post-send polling failed (non-blocking)', e);
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
  <div className="flex h-screen bg-background text-foreground">
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
        <TooltipProvider>
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
        </TooltipProvider>
      </div>

  <main className="flex-1 flex flex-col h-screen min-w-0 bg-background">
        <ChatHeader
          personaName={selectedPersona?.displayName || selectedPersona?.name || 'Default'}
          personaDescription={selectedPersona?.description}
          personaAvatar={selectedPersona?.avatarUrl}
          onSidebarToggle={() => handleSetSidebarOpen(true)}
          isLoggedIn={!!user}
          onNotesToggle={toggleContextHub}
        />
        
        <AnnouncementBanner />

        <div className="flex-1 min-h-0 flex">
          <MessageList
            messages={messages}
            isSending={isSending}
            isHistoryLoading={isHistoryLoading && !!activeChatId}
            activeChatId={activeChatId}
            activePersona={selectedPersona}
            personas={personas}
            onSmartToolAction={(prompt) => {
              inputRef.current?.setDraft(prompt);
              inputRef.current?.focus();
            }}
            className="flex-1 min-h-0"
            contentClassName="px-4 md:px-8 py-6 space-y-6"
          />
        </div>

        <div className="sticky bottom-0 w-full pt-6 relative">
            {/* Subtle radial gradient emanating from bottom */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-primary/8 via-primary/3 to-transparent rounded-t-full blur-3xl"></div>
            </div>
            
            <div className="mx-auto w-full px-4 pb-6 sm:max-w-3xl relative z-10">
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
                setSelectedPersonaId={(id) => {
                  setSelectedPersonaId(id);
                  setPersonaWasExplicitlySet(true);
                }}
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