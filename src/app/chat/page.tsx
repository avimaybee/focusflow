
'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { usePersonaManager } from '@/hooks/use-persona-manager';
import { useChatHistory } from '@/hooks/use-chat-history';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { useFileUpload, Attachment } from '@/hooks/use-file-upload';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageList } from '@/components/chat/message-list';
import { ChatInputArea } from '@/components/chat/chat-input-area';
import { Loader2, UploadCloud } from 'lucide-react';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { chat } from '@/ai/actions';
import type { ChatInput, ChatHistoryMessage, Persona } from '@/ai/flows/chat-types';
import { ChatMessageProps } from '@/components/chat-message';
import { AnnouncementBanner } from '@/components/announcement-banner';

type ChatContext = Attachment | null;

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

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [chatContext, setChatContext] = useState<ChatContext>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { personas, selectedPersona, selectedPersonaId, setSelectedPersonaId } = usePersonaManager();
  const { chatHistory, isLoading: isHistoryLoading } = useChatHistory();
  const { messages, isMessagesLoading } = useChatMessages(activeChatId);
  const { isDraggingOver, handleFileSelect, fileUploadHandlers } = useFileUpload(setChatContext);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const chatIdFromParams = params.chatId as string | undefined;
    setActiveChatId(chatIdFromParams || null);
  }, [params]);

  useEffect(() => {
    setChatContext(null);
  }, [activeChatId]);
  
  const clearChatContext = () => {
    setChatContext(null);
  }

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
    router.push('/chat');
  };
  
  const callAI = async (currentChatId: string, currentMessages: ChatMessageProps[]) => {
    if (!user?.uid) return;

    setIsLoading(true);

    try {
      const chatHistoryForAI: ChatHistoryMessage[] = currentMessages
        .map(m => {
          const text = m.role === 'model' ? m.rawText || m.text : m.text;
          return {
            role: m.role as 'user' | 'model',
            text: text as string,
          };
        })
        .filter(m => typeof m.text === 'string' && m.text.trim().length > 0);

      const lastMessage = chatHistoryForAI[chatHistoryForAI.length - 1];
      
      const chatInput: ChatInput = {
        userId: user.uid,
        message: lastMessage.text,
        persona: selectedPersonaId as Persona,
        history: chatHistoryForAI.slice(0, -1),
        isPremium: isPremium ?? false,
        context: chatContext?.url,
      };
      
      setChatContext(null); // Consume the context

      const result = await chat(chatInput);
      const responseText = result.response || "I’m sorry, I couldn’t process your request.";
      const rawResponseText = result.rawResponse || responseText;

      let messageContent: Partial<ChatMessageProps> = { role: 'model', text: responseText, rawText: rawResponseText };
      try {
        const parsedResponse = JSON.parse(rawResponseText);
        if (parsedResponse.flashcards) {
          messageContent = { role: 'model', text: 'Here are your flashcards!', flashcards: parsedResponse.flashcards, rawText: 'Generated flashcards.' };
        } else if (parsedResponse.quiz) {
          messageContent = { role: 'model', text: 'Here is your quiz!', quiz: parsedResponse.quiz, rawText: 'Generated a quiz.' };
        } else if (parsedResponse.summary) {
          const summaryText = `### ${parsedResponse.title || 'Summary'}\n\n${parsedResponse.summary}\n\n**Keywords:** ${parsedResponse.keywords.join(', ')}`;
          messageContent = { role: 'model', text: summaryText, rawText: summaryText };
        } else if (parsedResponse.plan) {
            let planText = `### ${parsedResponse.title || 'Study Plan'}\n\n`;
            Object.entries(parsedResponse.plan).forEach(([day, tasks]) => {
                planText += `**${day}**\n`;
                (tasks as string[]).forEach(task => planText += `- ${task}\n`);
                planText += '\n';
            });
          messageContent = { role: 'model', text: planText, rawText: planText };
        }
      } catch (e) { /* Not JSON */ }

      await addDoc(collection(db, 'users', user.uid, 'chats', currentChatId, 'messages'), {
        ...messageContent,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error calling AI:', error);
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'The AI failed to respond. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const prompt = input;
    if ((!prompt.trim() && !chatContext) || isLoading || !user?.uid) return;

    const userMessage: Partial<ChatMessageProps> = {
      role: 'user',
      text: prompt,
      images: chatContext && chatContext.type.startsWith('image/') ? [chatContext.url] : [],
      userAvatar: user?.photoURL,
      userName: user?.displayName || user?.email || 'User',
    };

    setInput('');
    let currentChatId = activeChatId;

    try {
        if (!currentChatId) {
            const chatDoc = await addDoc(collection(db, 'users', user.uid, 'chats'), {
              title: prompt.split(' ').slice(0, 5).join(' ').substring(0, 40) || 'New Chat',
              createdAt: serverTimestamp(),
            });
            currentChatId = chatDoc.id;
            setActiveChatId(currentChatId);
            router.push(`/chat/${currentChatId}`, { scroll: false });
          }

        await addDoc(collection(db, 'users', user.uid, 'chats', currentChatId, 'messages'), {
            ...userMessage,
            createdAt: serverTimestamp(),
        });
        
        // Directly call the AI after the user message has been successfully added.
        // The `messages` state from the hook will update automatically, so we can pass it here.
        const updatedMessages = [...messages, userMessage as ChatMessageProps];
        callAI(currentChatId, updatedMessages);

    } catch (error) {
        console.error('Error submitting message:', error);
        toast({
            variant: 'destructive',
            title: 'Message Failed',
            description: 'Could not send message. Please try again.',
        });
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
              className="fixed inset-0 z-10 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute z-20 h-full w-80 bg-background md:hidden"
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
          onSmartToolAction={() => {}}
        />

        <div className="w-full bg-background">
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
            chatContext={chatContext}
            clearChatContext={clearChatContext}
          />
        </div>
      </main>
    </div>
  );
}

    