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
import { Loader2, UploadCloud } from 'lucide-react';
import { doc, collection, onSnapshot, query, orderBy, Timestamp, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { ChatInput, validPersonas } from '@/ai/flows/chat-types';
import { ChatMessageProps } from '@/components/chat-message';
import { AnnouncementBanner } from '@/components/announcement-banner';

const chat = httpsCallable(functions, 'chat');

const SkeletonLoader = () => (
    <div className="p-4 space-y-4">
      <div className="h-8 bg-muted/50 rounded-md animate-pulse"></div>
      <div className="h-8 bg-muted/50 rounded-md animate-pulse w-2/3"></div>
      <div className="h-8 bg-muted/50 rounded-md animate-pulse w-5/6"></div>
    </div>
);

export default function ChatPage() {
  const { user, isPremium, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();

  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isMessagesLoading, setIsMessagesLoading] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { personas, selectedPersona, selectedPersonaId, setSelectedPersonaId } = usePersonaManager();
  const { chatHistory, isLoading: isHistoryLoading, forceRefresh } = useChatHistory();
  const { isDraggingOver, handleFileSelect, fileUploadHandlers } = useFileUpload(setAttachment);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const chatId = params.chatId as string | undefined;
    if (chatId) {
      setActiveChatId(chatId);
      setSessionId(chatId); // Use the chat ID as the session ID
    } else {
      handleNewChat();
    }
  }, [params.chatId]);

  useEffect(() => {
    if (!user || !activeChatId) {
      setIsMessagesLoading(false);
      return;
    }

    setIsMessagesLoading(true);
    const messagesRef = collection(db, 'users', user.uid, 'chats', activeChatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const chatMessages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatMessageProps[];
      setMessages(chatMessages);
      setIsMessagesLoading(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load chat messages.' });
      setIsMessagesLoading(false);
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
    setSessionId(undefined);
    setMessages([]);
    router.push('/chat');
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachment) || isLoading || !user) return;

    setIsLoading(true);
    const userMessageText = input.trim() || `File Attached: ${attachment?.name}`;
    const tempUserMessage: ChatMessageProps = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      text: userMessageText,
      createdAt: Timestamp.now(),
    };
    setMessages(prev => [...prev, tempUserMessage]);
    setInput('');
    const tempAttachment = attachment;
    setAttachment(null);
    
    try {
      let currentChatId = activeChatId;
      if (!currentChatId) {
        const newChatRef = doc(collection(db, 'users', user.uid, 'chats'));
        currentChatId = newChatRef.id;
        setActiveChatId(currentChatId);
        setSessionId(currentChatId);
        await setDoc(newChatRef, {
          title: userMessageText.substring(0, 40) || 'New Chat',
          createdAt: serverTimestamp(),
          userId: user.uid,
        });
        forceRefresh();
        router.push(`/chat/${currentChatId}`, { scroll: false });
      }

      const personaId: typeof validPersonas[number] = validPersonas.includes(selectedPersonaId as any)
          ? (selectedPersonaId as typeof validPersonas[number])
          : 'neutral';

      const chatInput: ChatInput = {
          userId: user.uid,
          message: userMessageText,
          sessionId: sessionId,
          persona: personaId,
          isPremium: isPremium ?? false,
          context: tempAttachment?.url,
      };

      const result: any = await chat(chatInput);
      
      const aiResponse: ChatMessageProps = {
          id: `temp-ai-${Date.now()}`,
          role: 'model',
          text: result.data.response,
          rawText: result.data.rawResponse,
          createdAt: Timestamp.now(),
      };
      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error('Error in chat flow:', error);
      toast({
          variant: 'destructive',
          title: 'AI Error',
          description: 'The AI failed to respond. Please try again.',
      });
      const errorResponse: ChatMessageProps = {
          id: `temp-error-${Date.now()}`,
          role: 'model',
          text: 'Sorry, an error occurred. Please try again.',
          isError: true,
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
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
          isLoading={isLoading}
          isHistoryLoading={isMessagesLoading}
          activeChatId={activeChatId}
          scrollAreaRef={scrollAreaRef}
          onSelectPrompt={setInput}
          onSmartToolAction={() => {}}
        />

        <div className="w-full bg-background">
            <div className="w-full sm:max-w-3xl lg:max-w-4xl mx-auto p-2">
              <ChatInputArea
                input={input}
                setInput={setInput}
                handleSendMessage={handleSendMessage}
                handleFileSelect={handleFileSelect}
                onSelectPrompt={setInput}
                isLoading={isLoading}
                isHistoryLoading={isMessagesLoading}
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