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
import { doc, collection, onSnapshot, query, orderBy, Timestamp, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { chat } from '@/ai/actions';
import { ChatInput, ChatHistoryMessage, Persona, validPersonas } from '@/functions/src/chat-types';
import { ChatMessageProps } from '@/components/chat-message';
import { AnnouncementBanner } from '@/components/announcement-banner';
import { SmartToolActions } from '@/lib/constants';

import { rewriteText, generateBulletPoints, generateCounterarguments, highlightKeyInsights } from '@/ai/actions';


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

  useEffect(() => {
    const chatIdFromUrl = params.chatId as string | undefined;
    if (chatIdFromUrl) {
      if (chatIdFromUrl !== activeChatId) {
        setActiveChatId(chatIdFromUrl);
      }
    } else {
      handleNewChat();
    }
  }, [params.chatId]);

  useEffect(() => {
    if (!user || !activeChatId) {
      if (!params.chatId) {
        setIsMessagesLoading(false);
      }
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
  }, [activeChatId, user, toast, params.chatId]);

  useEffect(() => {
    if (scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')) {
      const scrollableView = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')!;
      scrollableView.scrollTo({ top: scrollableView.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    if (params.chatId) {
        router.push('/chat');
    }
  };
  
  const handleSmartToolAction = async (tool: any, messageText: string) => {
    setIsLoading(true);
    let resultText = '';

    try {
        switch (tool.action) {
            case SmartToolActions.REWRITE:
                const rewriteResult = await rewriteText({ textToRewrite: messageText, style: tool.value });
                resultText = `**Rewritten for Clarity:**\n\n${rewriteResult.rewrittenText}`;
                break;
            case SmartToolActions.BULLET_POINTS:
                const bulletResult = await generateBulletPoints({ textToConvert: messageText });
                resultText = `**Key Points:**\n\n${bulletResult.bulletPoints.map(p => `- ${p}`).join('\n')}`;
                break;
            case SmartToolActions.COUNTERARGUMENTS:
                const counterResult = await generateCounterarguments({ statementToChallenge: messageText });
                resultText = `**Counterarguments:**\n\n${counterResult.counterarguments.map(p => `- ${p}`).join('\n')}`;
                break;
            case SmartToolActions.INSIGHTS:
                const insightResult = await highlightKeyInsights({ sourceText: messageText });
                resultText = `**Key Insights:**\n\n${insightResult.insights.map(p => `- ${p}`).join('\n')}`;
                break;
        }

        const aiResponse: ChatMessageProps = {
            id: `temp-ai-${Date.now()}`,
            role: 'model',
            text: resultText.replace(/\n/g, '<br/>'),
            rawText: resultText,
            createdAt: Timestamp.now(),
        };
        setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
        console.error(`Error processing smart tool action '${tool.name}':`, error);
        toast({ variant: 'destructive', title: 'Smart Tool Error', description: 'Could not process your request.' });
    } finally {
        setIsLoading(false);
    }
  };


  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachment) || isLoading || !user) return;

    setIsLoading(true);
    const userMessageText = input.trim();
    setInput('');
    const tempAttachment = attachment;
    setAttachment(null);
    
    let currentChatId = activeChatId;
    // Create a new chat document in Firestore if one doesn't exist
    if (!currentChatId) {
        const newChatRef = doc(collection(db, 'users', user.uid, 'chats'));
        currentChatId = newChatRef.id;
        await setDoc(newChatRef, {
          title: userMessageText.substring(0, 40) || 'New Chat',
          createdAt: serverTimestamp(),
          userId: user.uid,
        });
        setActiveChatId(currentChatId);
        forceRefresh();
        router.push(`/chat/${currentChatId}`, { scroll: false });
    }

    const userMessage: Omit<ChatMessageProps, 'id'> = {
      role: 'user',
      text: userMessageText,
      createdAt: Timestamp.now(),
    };

    // Add user message to Firestore
    const messagesRef = collection(db, 'users', user.uid, 'chats', currentChatId, 'messages');
    await addDoc(messagesRef, userMessage);
    
    // Convert current messages state to the format Genkit expects
    const historyForAI: ChatHistoryMessage[] = messages.map(m => ({
        role: m.role,
        text: m.rawText || (typeof m.text === 'string' ? m.text.replace(/<[^>]*>/g, '') : ''),
    }));

    const personaId = validPersonas.includes(selectedPersonaId as any)
        ? (selectedPersonaId as Persona)
        : 'neutral';

    const chatInput: ChatInput = {
        userId: user.uid,
        message: userMessageText,
        history: historyForAI,
        persona: personaId,
        isPremium: isPremium ?? false,
        context: tempAttachment?.url,
    };

    const result = await chat(chatInput);

    if (result && !result.isError) {
        const aiResponse: Omit<ChatMessageProps, 'id'> = {
            role: 'model',
            text: result.response,
            rawText: result.rawResponse,
            createdAt: Timestamp.now(),
        };
        // Add AI response to Firestore
        await addDoc(messagesRef, aiResponse);
    } else if (result.isError) {
        const errorResponse: Omit<ChatMessageProps, 'id'> = {
            role: 'model',
            text: result.response,
            isError: true,
            createdAt: Timestamp.now()
        };
        await addDoc(messagesRef, errorResponse);
    }
    
    setIsLoading(false);
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
          onSmartToolAction={handleSmartToolAction}
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
