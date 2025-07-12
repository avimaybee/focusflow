
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
import { doc, collection, addDoc, serverTimestamp, getDocs, orderBy, query, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { chat } from '@/ai/actions';
import { ChatInput, ChatHistoryMessage } from '@/ai/flows/chat-types';
import { ChatMessageProps } from '@/components/chat-message';
import { AnnouncementBanner } from '@/components/announcement-banner';
import { SmartToolActions } from '@/lib/constants';

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

  // Effect to load messages when activeChatId changes
  useEffect(() => {
    const chatIdFromParams = params.chatId as string | undefined;

    if (!user) {
        if (!chatIdFromParams) {
             // New guest chat
            setActiveChatId(null);
            setMessages([{
                role: 'model',
                text: 'Hello! Ask me to summarize notes, create a quiz, or build a study plan.',
            }]);
            setIsMessagesLoading(false);
        }
        return;
    };

    if (chatIdFromParams && chatIdFromParams !== activeChatId) {
        setActiveChatId(chatIdFromParams);
    } else if (!chatIdFromParams) {
        setActiveChatId(null);
        setMessages([{
            role: 'model',
            text: 'Hello! Ask me to summarize notes, create a quiz, or build a study plan.',
        }]);
        setIsMessagesLoading(false);
    }
    
    if (chatIdFromParams) {
      setIsMessagesLoading(true);
      const messagesRef = collection(db, 'users', user.uid, 'chats', chatIdFromParams, 'messages');
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
    }
  }, [params.chatId, user, toast]);


  useEffect(() => {
    if (scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')) {
      const scrollableView = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')!;
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

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([{
        role: 'model',
        text: 'Hello! Ask me to summarize notes, create a quiz, or build a study plan.',
    }]);
    router.push('/chat');
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachment) || isLoading) return;
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Please log in',
            description: 'You need to be logged in to save and continue conversations.',
        });
        return;
    }

    setIsLoading(true);
    const userMessageText = input.trim() || `File Attached: ${attachment?.name}`;
    const userMessage: Omit<ChatMessageProps, 'id'> = {
        role: 'user',
        text: userMessageText,
        rawText: userMessageText,
        createdAt: serverTimestamp(),
    };

    setMessages(prev => [...prev, { ...userMessage, id: 'temp-user' } as ChatMessageProps]);
    setInput('');
    const tempAttachment = attachment;
    setAttachment(null);
    
    let currentChatId = activeChatId;

    try {
        // Create new chat session in Firestore if it doesn't exist
        if (!currentChatId) {
            const chatDocRef = await addDoc(collection(db, 'users', user.uid, 'chats'), {
                title: userMessageText.substring(0, 40) || 'New Chat',
                createdAt: serverTimestamp(),
                userId: user.uid,
            });
            currentChatId = chatDocRef.id;
            setActiveChatId(currentChatId);
            forceRefresh(); // Refresh sidebar
            router.push(`/chat/${currentChatId}`, { scroll: false });
        }
        
        // Add user message to Firestore
        await addDoc(collection(db, 'users', user.uid, 'chats', currentChatId, 'messages'), userMessage);

        const historyForAI: ChatHistoryMessage[] = messages
            .filter(m => !m.isError) // Exclude previous errors from history
            .map(m => ({
                role: m.role,
                text: m.rawText || (typeof m.text === 'string' ? m.text : ''),
            }));
        historyForAI.push({ role: 'user', text: userMessageText });

        const chatInput: ChatInput = {
            userId: user.uid,
            message: userMessageText,
            history: historyForAI,
            persona: selectedPersonaId,
            isPremium: isPremium ?? false,
            context: tempAttachment?.url, // Pass the data URI
        };

        const result = await chat(chatInput);
        
        const aiResponse: Omit<ChatMessageProps, 'id'> = {
            role: 'model',
            text: result.response || "I’m sorry, I couldn’t process your request.",
            rawText: result.rawResponse || result.response,
            createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'users', user.uid, 'chats', currentChatId, 'messages'), aiResponse);
    } catch (error) {
        console.error('Error in chat flow:', error);
        toast({
            variant: 'destructive',
            title: 'AI Error',
            description: 'The AI failed to respond. Please try again.',
        });
        // Add an error message to the UI
        const errorResponse: ChatMessageProps = {
            id: 'temp-error',
            role: 'model',
            text: 'Sorry, an error occurred. Please try again.',
            isError: true,
        };
        setMessages(prev => [...prev, errorResponse]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSelectPrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  if (authLoading) {
    return (
      <div className="flex h-screen bg-background text-foreground">
        <div className="hidden md:flex w-80 flex-col bg-secondary/30 p-4 border-r border-border/60">
            <SkeletonLoader />
        </div>
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        </div>
      </div>
    );
  }

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
                onChatSelect={(id) => {
                  router.push(`/chat/${id}`);
                  setSidebarOpen(false);
                }}
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
          onSelectPrompt={handleSelectPrompt}
          onSmartToolAction={() => {}} // Placeholder for now
        />

        <div className="w-full bg-background">
            <div className="w-full sm:max-w-3xl lg:max-w-4xl mx-auto p-2">
              <ChatInputArea
                input={input}
                setInput={setInput}
                handleSendMessage={handleSendMessage}
                handleFileSelect={handleFileSelect}
                onSelectPrompt={handleSelectPrompt}
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
