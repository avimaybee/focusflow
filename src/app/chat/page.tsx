
'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
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
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();

  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const { personas, selectedPersona, selectedPersonaId, setSelectedPersonaId } = usePersonaManager();
  const { chatHistory, isLoading: isHistoryLoading, forceRefresh } = useChatHistory();
  const { isDraggingOver, handleFileSelect, fileUploadHandlers } = useFileUpload(setAttachment);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const chatIdFromUrl = params.chatId as string | undefined;
    if (chatIdFromUrl) {
      if (chatIdFromUrl !== activeChatId) {
        setActiveChatId(chatIdFromUrl);
      }
    } else {
      // If there's no chat ID in the URL, treat it as a new chat
      if (activeChatId) handleNewChat();
    }
  }, [params.chatId]);

  useEffect(() => {
    if (!user || !activeChatId) {
        setMessages([]);
        return;
    }
  
    const chatRef = doc(db, 'users', user.uid, 'chats', activeChatId);
    
    const unsubscribe = onSnapshot(chatRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const sessionData = docSnapshot.data();
        const history = sessionData.history || [];
        
        const chatMessagesPromises = history.map(async (msg: any, index: number) => {
            let textContent = '';
            if (msg.role === 'model') {
                const textPart = msg.content?.find((p: any) => p.text);
                textContent = textPart?.text || '';
            } else if (msg.role === 'user') {
                const textPart = msg.content?.find((p: any) => p.text);
                textContent = textPart?.text || '';
            }
          
          return { 
            id: `${docSnapshot.id}-${index}`,
            role: msg.role,
            text: await marked.parse(textContent),
            rawText: textContent,
            createdAt: sessionData.updatedAt || Timestamp.now()
          }
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
    router.push('/chat');
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || authLoading ) return;

    if (!user) {
        console.error("CLIENT DEBUG: handleSendMessage called but user is not logged in.");
        toast({
            variant: 'destructive',
            title: 'Not Logged In',
            description: "Please log in to send a message.",
        });
        return;
    }
  
    setIsSending(true);
    const userMessage: ChatMessageProps = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: input,
      rawText: input,
      createdAt: Timestamp.now(),
    };
    setMessages(prev => [...prev, userMessage]);
  
    const chatInput = {
      message: input.trim(),
      sessionId: activeChatId || undefined,
      persona: selectedPersonaId,
      context: attachment?.url,
    };
  
    setInput('');
    setAttachment(null);
  
    try {
      console.log('CLIENT DEBUG: User object available:', !!user);
      const idToken = await user.getIdToken();
      console.log(`CLIENT DEBUG: Successfully fetched ID token. Length: ${idToken.length}`);

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      };
      console.log('CLIENT DEBUG: Request headers prepared:', {
        'Content-Type': headers['Content-Type'],
        'Authorization': `Bearer ${idToken.substring(0, 15)}...`
      });

      console.log('CLIENT DEBUG: Sending request to /api/chat with input:', chatInput);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(chatInput),
      });
  
      const result = await response.json();
      
      if (!response.ok) {
        console.error('CLIENT DEBUG: Received error response from server:', result);
        throw new Error(result.error || `Request failed with status ${response.status}`);
      }
      
      console.log('CLIENT DEBUG: Received successful response from server:', result);
  
      if (result.sessionId && !activeChatId) {
        setActiveChatId(result.sessionId);
        router.push(`/chat/${result.sessionId}`);
        forceRefresh();
      }
  
    } catch (error: any) {
      console.error("--- CLIENT DEBUG: CATCH BLOCK ---");
      console.error("Full error object:", error);
      console.error("-----------------------------------");
  
      let description = 'An unknown error occurred.';
      if (error.message) {
        description = error.message;
      }
  
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: description,
      });
  
      const errorResponse: ChatMessageProps = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `<p>Sorry, there was a connection error. Please try again.</p><p><i>Detail: ${description}</i></p>`,
        rawText: `Sorry, there was a connection error. Please try again. Detail: ${description}`,
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
              className="fixed z-40 h-full w-80 bg-background md:hidden"
            >
              <ChatSidebar
                user={user}
                chatHistory={chatHistory}
                activeChatId={activeChatId}
                onNewChat={handleNewChat}
                onChatSelect={(id) => router.push(`/chat/${id}`)}
                isLoading={isHistoryLoading}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <div className="hidden md:flex">
        <ChatSidebar
            user={user}
            chatHistory={chatHistory}
            activeChatId={activeChatId}
            onNewChat={handleNewChat}
            onChatSelect={(id) => router.push(`/chat/${id}`)}
            isLoading={isHistoryLoading}
        />
      </div>

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
                textareaRef={textareaRef}
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

    