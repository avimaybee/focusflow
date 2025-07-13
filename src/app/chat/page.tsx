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
import { streamChat } from '@/ai/actions';
import { Persona, validPersonas } from '@/types/chat-types';
import { ChatMessageProps } from '@/components/chat-message';
import { AnnouncementBanner } from '@/components/announcement-banner';
import { SmartToolActions } from '@/lib/constants';

import { rewriteText, generateBulletPoints, generateCounterarguments, highlightKeyInsights } from '@/ai/actions';
import { marked } from 'marked';


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
    const messagesRef = collection(db, 'users', user.uid, 'sessions', activeChatId, 'history');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const chatMessages = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
              id: doc.id,
              role: data.role,
              text: marked.parse(data.content?.[0]?.text || ''), // Parse markdown
              rawText: data.content?.[0]?.text || '',
              createdAt: data.timestamp ? new Timestamp(data.timestamp.seconds, data.timestamp.nanoseconds) : Timestamp.now()
          }
      }) as ChatMessageProps[];
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
  }, [messages, isLoading]);

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
                const insightResult = await highlightKeyInsights({ text: messageText });
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

    if (!currentChatId) {
      const newChatId = crypto.randomUUID();
      currentChatId = newChatId;
      setActiveChatId(newChatId);
      forceRefresh();
      router.push(`/chat/${newChatId}`, { scroll: false });
    }

    const userMessageForUI: ChatMessageProps = {
        id: `temp-user-${Date.now()}`,
        role: 'user',
        text: userMessageText,
        createdAt: Timestamp.now(),
    };
    setMessages(prev => [...prev, userMessageForUI]);
    
    const personaId = validPersonas.includes(selectedPersonaId as any)
        ? (selectedPersonaId as Persona)
        : 'neutral';

    const chatInput = {
        message: userMessageText,
        sessionId: currentChatId,
        persona: personaId,
        isPremium: isPremium ?? false,
        context: tempAttachment?.url,
    };

    try {
      const response = await streamChat(chatInput);

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred.' }));
        throw new Error(errorData.error);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      let aiResponseText = '';
      const aiResponseId = `temp-ai-${Date.now()}`;

      // Add a placeholder for the AI message
      setMessages(prev => [...prev, { id: aiResponseId, role: 'model', text: '', rawText: '', createdAt: Timestamp.now() }]);

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          aiResponseText += decoder.decode(value, { stream: true });
          const formattedHtml = await marked.parse(aiResponseText);
          setMessages(prev => prev.map(msg => 
            msg.id === aiResponseId 
              ? { ...msg, text: formattedHtml, rawText: aiResponseText } 
              : msg
          ));
        }
      }

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Connection Error',
            description: error.message || 'Could not connect to the AI service. Please try again.',
        });
        const errorResponse: ChatMessageProps = {
            id: `err-${Date.now()}`,
            role: 'model',
            text: '<p>Sorry, there was a connection error. Please try again.</p>',
            rawText: 'Sorry, there was a connection error. Please try again.',
            isError: true,
            createdAt: Timestamp.now()
        };
        setMessages(prev => [...prev, errorResponse]);
    }
    
    setIsLoading(false);
    forceRefresh();
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
