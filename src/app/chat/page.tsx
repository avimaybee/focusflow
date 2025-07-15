
'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { useToast } from '@/hooks/use-toast';
import { usePersonaManager } from '@/hooks/use-persona-manager';
import { useChatHistory } from '@/hooks/use-chat-history';
import { useFileUpload, Attachment } from '@/hooks/use-file-upload';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageList } from '@/components/chat/message-list';
import { ChatInputArea } from '@/components/chat/chat-input-area';
import { UploadCloud } from 'lucide-react';
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
import Link from 'next/link';

const GUEST_MESSAGE_LIMIT = 10;

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const { onOpen: openAuthModal } = useAuthModal();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();

  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  
  // State for guest users
  const [guestMessageCount, setGuestMessageCount] = useState(0);

  const { personas, selectedPersona, selectedPersonaId, setSelectedPersonaId } = usePersonaManager();
  const { chatHistory, isLoading: isHistoryLoading, forceRefresh } = useChatHistory();
  const { isDraggingOver, handleFileSelect, fileUploadHandlers } = useFileUpload(setAttachment);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Effect to sync the active chat ID with the URL
  useEffect(() => {
    const chatIdFromUrl = params.chatId as string | undefined;
    if (chatIdFromUrl) {
      if (chatIdFromUrl !== activeChatId) {
        setActiveChatId(chatIdFromUrl);
      }
    } else {
      // If there's no chat ID in the URL, it's a new chat.
      // We check if there *was* an active chat to avoid running this on initial load.
      if (activeChatId) {
        handleNewChat();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.chatId, activeChatId]);

  // Effect to handle chat history for LOGGED-IN users.
  // This does NOT manage chat state, only loads history from Firestore on chat select.
  useEffect(() => {
    if (!user || !activeChatId) {
        if (!user) { // If user logs out, clear any existing local messages
            setMessages([]);
            setGuestMessageCount(0);
        }
        return;
    }
  
    // This is a one-time read or a listener for the session document
    const chatRef = doc(db, 'users', user.uid, 'chats', activeChatId);
    
    const unsubscribe = onSnapshot(chatRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const sessionData = docSnapshot.data();
        const history = sessionData.threads?.main || [];
        
        const chatMessagesPromises = history
          .filter((msg: any) => msg.role !== 'system') // Filter out system prompts
          .map(async (msg: any, index: number) => {
            const textContent = msg.content?.find((p: any) => p.text)?.text || '';

            // Handle structured tool output
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
          
          return { 
            id: `${docSnapshot.id}-${index}`,
            role: msg.role,
            text: await marked.parse(textContent),
            rawText: textContent,
            createdAt: sessionData.updatedAt || Timestamp.now(),
            userName: msg.role === 'user' ? user.displayName : undefined,
            userAvatar: msg.role === 'user' ? user.photoURL : undefined,
            ...toolCallOutput,
          } as ChatMessageProps;
        });

        const resolvedMessages = await Promise.all(chatMessagesPromises);
        setMessages(resolvedMessages);
      } else {
        setMessages([]); // Clear messages if document doesn't exist
      }
    }, (error) => {
      console.error("Error fetching chat document:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load chat session.' });
    });
    
    return () => unsubscribe();
  }, [activeChatId, user, toast]);

  // Effect to scroll to the bottom of the chat when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')) {
      const scrollableView = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')!;
      scrollableView.scrollTo({ top: scrollableView.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Function to start a new chat
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

  // Main function to handle sending a message
  const handleSendMessage = async (e: FormEvent, prompt?: string) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const messageToSend = prompt || input;
    if (!messageToSend.trim() && !attachment || isSending || authLoading ) return;

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
        text: await marked.parse(messageToSend.trim()),
        rawText: messageToSend.trim(),
        userName: user?.displayName || 'Guest',
        userAvatar: user?.photoURL || null,
        createdAt: Timestamp.now(),
    };
    setMessages(prev => [...prev, userMessage]);

    if (!user) {
        setGuestMessageCount(prev => prev + 1);
    }
  
    const chatInput = {
      message: messageToSend.trim(),
      sessionId: user ? activeChatId || undefined : undefined,
      persona: selectedPersonaId,
      context: attachment?.url,
    };
  
    setInput('');
    setAttachment(null);
  
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
  
      const result = await response.json();
      
      if (!response.ok) {
        throw { response, result };
      }
      
      if (user && result.sessionId && !activeChatId) {
        // Logged-in user on a new chat; redirect and let the listener handle the update
        router.push(`/chat/${result.sessionId}`);
        forceRefresh();
      } else if (!user) {
        // GUEST USER: Manually add AI response to local state.
        const modelResponse: ChatMessageProps = {
            id: `guest-ai-${Date.now()}`,
            role: 'model',
            text: await marked.parse(result.response),
            rawText: result.response,
            flashcards: result.flashcards, // Pass structured data
            quiz: result.quiz,             // Pass structured data
            createdAt: Timestamp.now(),
        };
        setMessages(prev => [...prev, modelResponse]);
      } else if (user) {
        // LOGGED-IN USER (existing chat): Do nothing. The Firestore onSnapshot listener will handle the update.
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
    <div className="flex h-screen bg-background text-foreground">
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-30 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed z-40 h-full md:hidden"
            >
              <ChatSidebar
                user={user}
                chatHistory={chatHistory}
                activeChatId={activeChatId}
                onNewChat={handleNewChat}
                onChatSelect={(id) => router.push(`/chat/${id}`)}
                onDeleteChat={handleDeleteChat}
                isLoading={isHistoryLoading}
                isCollapsed={false}
                onToggle={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
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

      <main className="flex-1 flex flex-col h-screen overflow-hidden" {...fileUploadHandlers}>
        {isDraggingOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 text-white p-8 border-2 border-dashed border-white rounded-lg">
              <UploadCloud className="h-16 w-16" />
              <p className="text-lg font-semibold">Drop your file here</p>
            </div>
          </div>
        )}

        <ChatHeader
          personaName={selectedPersona?.name || 'Default'}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          isLoggedIn={!!user}
        />
        
        <AnnouncementBanner />

        <MessageList
          messages={messages}
          isSending={isSending}
          isHistoryLoading={isHistoryLoading && !!activeChatId}
          activeChatId={activeChatId}
          scrollAreaRef={scrollAreaRef}
          onSelectPrompt={setInput}
          onSmartToolAction={(prompt) => {
            const syntheticEvent = {} as FormEvent;
            handleSendMessage(syntheticEvent, prompt);
          }}
        />

        <div className="w-full bg-background">
            <div className="w-full sm:max-w-3xl lg:max-w-4xl mx-auto p-2">
              <ChatInputArea
                input={input}
                setInput={setInput}
                handleSendMessage={handleSendMessage}
                handleFileSelect={handleFileSelect}
                onSelectPrompt={setInput}
                isSending={isSending}
                isHistoryLoading={isHistoryLoading}
                personas={personas}
                selectedPersonaId={selectedPersonaId}
                setSelectedPersonaId={setSelectedPersonaId}
                activeChatId={activeChatId}
                chatContext={attachment}
                clearChatContext={() => setAttachment(null)}
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
    </div>
  );
}
