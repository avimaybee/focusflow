
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
      // If there's no chat ID in the URL, it's a new chat, so clear state.
      if (activeChatId) handleNewChat();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.chatId]);

  // Effect to listen for changes in the active chat document in Firestore
  useEffect(() => {
    if (!user || !activeChatId) {
        setMessages([]); // Clear messages if no user or active chat
        return;
    }
  
    // Listen to the specific chat document for the current user
    const chatRef = doc(db, 'users', user.uid, 'chats', activeChatId);
    
    const unsubscribe = onSnapshot(chatRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const sessionData = docSnapshot.data();
        // THE FIX: Read from the correct nested field where Genkit stores chat history.
        const history = sessionData.threads?.main || [];
        
        // Map the stored history to the format our ChatMessage component expects
        const chatMessagesPromises = history.map(async (msg: any, index: number) => {
            // Find the text part of the message content
            const textPart = msg.content?.find((p: any) => p.text);
            const textContent = textPart?.text || '';
          
          return { 
            id: `${docSnapshot.id}-${index}`,
            role: msg.role,
            text: await marked.parse(textContent), // Parse markdown for display
            rawText: textContent,
            createdAt: sessionData.updatedAt || Timestamp.now(),
            userName: msg.role === 'user' ? user.displayName : undefined,
            userAvatar: msg.role === 'user' ? user.photoURL : undefined,
          } as ChatMessageProps;
        });

        const resolvedMessages = await Promise.all(chatMessagesPromises);
        setMessages(resolvedMessages);
      } else {
        // If the document doesn't exist (e.g., old/deleted chat ID), clear messages
        setMessages([]);
      }
    }, (error) => {
      console.error("Error fetching chat document:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load chat session.' });
    });
    
    // Cleanup the listener when the component unmounts or dependencies change
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
    router.push('/chat');
  };

  // Main function to handle sending a message
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachment || isSending || authLoading ) return;

    if (!user) {
        openAuthModal('signup');
        return;
    }
  
    setIsSending(true);
  
    const chatInput = {
      message: input.trim(),
      sessionId: activeChatId || undefined, // Pass current session ID or none for a new chat
      persona: selectedPersonaId,
      context: attachment?.url, // Pass file data URI if attached
    };
  
    // Clear the input fields after sending
    setInput('');
    setAttachment(null);
  
    try {
      const idToken = await user.getIdToken();
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(chatInput),
      });
  
      const result = await response.json();
      
      if (!response.ok) {
        // Pass the entire response to the error handler
        throw { response, result };
      }
      
      // If this was a new chat, the server returns a new session ID.
      // We then redirect the user to the new chat's URL.
      if (result.sessionId && !activeChatId) {
        router.push(`/chat/${result.sessionId}`);
        forceRefresh(); // Refresh the sidebar to show the new chat
      }
  
    } catch (error: any) {
      console.error("Client-side send message error:", error);
      toast({
        variant: 'destructive',
        title: 'Message Failed',
        description: error.result?.error || error.message || 'An unknown error occurred.',
      });
  
      // Add an error message to the chat UI
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
      </main>
    </div>
  );
}
