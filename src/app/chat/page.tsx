'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { chat, rewriteText, generateBulletPoints, generateCounterarguments, generatePresentationOutline, highlightKeyInsights } from '@/ai/actions';
import type { ChatInput, ChatHistoryMessage, Persona } from '@/ai/flows/chat-types';
import { ChatMessageProps } from '@/components/chat-message';

export default function ChatPage() {
  const { user, isPremium, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { personas, selectedPersona, selectedPersonaId, setSelectedPersonaId } = usePersonaManager();
  const { chatHistory } = useChatHistory();
  const { messages, setMessages, isHistoryLoading } = useChatMessages(activeChatId);
  const { attachments, setAttachments, isDraggingOver, handleFileSelect, fileUploadHandlers } = useFileUpload();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const chatIdFromParams = params.chatId as string | undefined;
    setActiveChatId(chatIdFromParams || null);
  }, [params]);

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

  const submitMessage = async (prompt: string, attachedFiles: Attachment[]) => {
    if ((!prompt.trim() && attachedFiles.length === 0) || isLoading || !user?.uid) return;

    const userMessage: ChatMessageProps = {
      role: 'user',
      text: prompt,
      images: attachedFiles.filter(f => f.type.startsWith('image/')).map(f => f.preview),
      userAvatar: user?.photoURL,
      userName: user?.displayName || user?.email || 'User',
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');
    setAttachments([]);

    let currentChatId = activeChatId;

    try {
      if (!currentChatId) {
        const chatDoc = await addDoc(collection(db, 'users', user.uid, 'chats'), {
          title: prompt.split(' ').slice(0, 5).join(' ').substring(0, 40) || 'New Chat',
          createdAt: serverTimestamp(),
        });
        currentChatId = chatDoc.id;
        router.push(`/chat/${currentChatId}`, { scroll: false });
        setActiveChatId(currentChatId);
      }

      await addDoc(collection(db, 'users', user.uid, 'chats', currentChatId, 'messages'), {
        role: 'user',
        text: JSON.stringify({ role: 'user', text: prompt }),
        createdAt: serverTimestamp(),
      });

      const chatHistoryForAI: ChatHistoryMessage[] = messages
        .filter(m => typeof m.text === 'string' && (m.role === 'user' || m.role === 'model'))
        .map(m => ({
          role: m.role as 'user' | 'model',
          text: m.text as string,
        }));

      const finalAttachments = attachedFiles.map(a => a.data);
      const chatInput: ChatInput = {
        message: prompt.trim(),
        persona: selectedPersonaId as Persona,
        history: chatHistoryForAI,
        isPremium: isPremium ?? false,
        context: finalAttachments.find(a => a.includes('application/pdf')) || finalAttachments.find(a => a.includes('text/plain')) || undefined,
        image: finalAttachments.find(a => a.includes('image/')) || undefined,
      };

      const result = await chat(chatInput).catch((err) => {
        console.error("AI chat error:", err);
        return { response: "I’m sorry, I couldn’t process your request. Please try rephrasing or uploading a different file." }
      });
      const responseText = result.response || "I’m sorry, I couldn’t process your request. Please try again.";

      let messageContent: ChatMessageProps = { role: 'model', text: responseText };
      try {
        const parsedResponse = JSON.parse(responseText);
        if (parsedResponse.flashcards) {
          messageContent = { role: 'model', text: 'Here are your flashcards!', flashcards: parsedResponse.flashcards };
        } else if (parsedResponse.quiz) {
          messageContent = { role: 'model', text: 'Here is your quiz!', quiz: parsedResponse.quiz };
        }
      } catch (e) { /* Not JSON, treat as plain text */ }

      await addDoc(collection(db, 'users', user.uid, 'chats', currentChatId, 'messages'), {
        role: 'model',
        text: JSON.stringify(messageContent),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error in submitMessage:', error);
      toast({
        variant: 'destructive',
        title: 'Message Failed',
        description: 'Could not send message. Please try again.',
      });
      setMessages(prev => prev.slice(0, prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    await submitMessage(input, attachments);
  };

  const handleSelectPrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const handleSmartToolAction = async (tool: any, messageText: string) => {
    if (!user?.uid) return;

    let currentChatId = activeChatId;
    const userPrompt = `${tool.name}: "${messageText.substring(0, 50)}..."`;

    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: userPrompt }]);

    try {
      if (!currentChatId) {
        const chatDoc = await addDoc(collection(db, 'users', user.uid, 'chats'), {
          title: userPrompt,
          createdAt: serverTimestamp(),
        });
        currentChatId = chatDoc.id;
        setActiveChatId(currentChatId);
        router.push(`/chat/${currentChatId}`, { scroll: false });
      }

      await addDoc(collection(db, 'users', user.uid, 'chats', currentChatId, 'messages'), {
        role: 'user', text: JSON.stringify({role: 'user', text: userPrompt }), createdAt: serverTimestamp()
      });

      const sourceArg = { sourceText: messageText, persona: selectedPersonaId as Persona };
      let actionFn: Promise<any>;
      let formatResult: (result: any) => string;

      switch (tool.action) {
        case 'rewrite':
          actionFn = rewriteText({ textToRewrite: messageText, style: tool.value, persona: selectedPersonaId as Persona });
          formatResult = (result) => result.rewrittenText;
          break;
        case 'bulletPoints':
          actionFn = generateBulletPoints({textToConvert: messageText, persona: selectedPersonaId as Persona });
          formatResult = (result) => result.bulletPoints.map((pt: string) => `- ${pt}`).join('\n');
          break;
        case 'counterarguments':
          actionFn = generateCounterarguments({ statementToChallenge: messageText, persona: selectedPersonaId as Persona });
          formatResult = (result) => result.counterarguments.map((arg: string, i: number) => `${i + 1}. ${arg}`).join('\n\n');
          break;
        case 'presentation':
          actionFn = generatePresentationOutline(sourceArg);
          formatResult = (result) => {
            let outlineString = `## ${result.title}\n\n`;
            result.slides.forEach((slide: any, index: number) => {
              outlineString += `### **Slide ${index + 1}: ${slide.title}**\n`;
              slide.bulletPoints.forEach((point: string) => outlineString += `- ${point}\n`);
              outlineString += '\n';
            });
            return outlineString;
          };
          break;
        case 'insights':
          actionFn = highlightKeyInsights(sourceArg);
          formatResult = (result) => {
            let insightsString = '### Key Insights\n\n';
            result.insights.forEach((insight: string) => insightsString += `- ${insight}\n`);
            return insightsString;
          };
          break;
        default:
          throw new Error("Invalid tool action");
      }

      const result = await actionFn;
      const formattedResult = formatResult(result);

      await addDoc(collection(db, 'users', user.uid, 'chats', currentChatId, 'messages'), {
        role: 'model', text: JSON.stringify({role: 'model', text: formattedResult}), createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error(`Error in ${tool.action} action:`, error);
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: `Could not perform ${tool.name}. Please try again.`,
      });
      setMessages(prev => prev.slice(0, prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const mobileSidebar = (
    <div className={`absolute z-20 h-full w-80 bg-background md:hidden ${sidebarOpen ? 'flex' : 'hidden'}`}>
        <ChatSidebar
            user={user}
            chatHistory={chatHistory}
            activeChatId={activeChatId}
            onNewChat={handleNewChat}
            onChatSelect={(id) => {
                router.push(`/chat/${id}`);
                setSidebarOpen(false);
            }}
        />
    </div>
  )

  return (
    <div className="flex h-screen bg-background text-foreground">
      {mobileSidebar}
      <ChatSidebar
        user={user}
        chatHistory={chatHistory}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onChatSelect={(id) => router.push(`/chat/${id}`)}
      />

      <main className="flex-1 flex flex-col h-screen" {...fileUploadHandlers}>
        {isDraggingOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in">
            <div className="flex flex-col items-center gap-4 text-white p-8 border-2 border-dashed border-white rounded-lg bg-black/20">
              <UploadCloud className="h-16 w-16" />
              <p className="text-lg font-semibold">Drop your file here</p>
            </div>
          </div>
        )}

        <ChatHeader
          personaName={selectedPersona.name}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          isLoggedIn={!!user}
        />

        <MessageList
          messages={messages}
          isLoading={isLoading}
          isHistoryLoading={isHistoryLoading}
          activeChatId={activeChatId}
          scrollAreaRef={scrollAreaRef}
          onSelectPrompt={handleSelectPrompt}
          onSmartToolAction={handleSmartToolAction}
        />

        <ChatInputArea
          input={input}
          setInput={setInput}
          attachments={attachments}
          setAttachments={setAttachments}
          handleSendMessage={handleSendMessage}
          handleFileSelect={handleFileSelect}
          onSelectPrompt={handleSelectPrompt}
          isLoading={isLoading}
          isHistoryLoading={isHistoryLoading}
          personas={personas}
          selectedPersonaId={selectedPersonaId}
          setSelectedPersonaId={setSelectedPersonaId}
          textareaRef={textareaRef}
          activeChatId={activeChatId}
        />
      </main>
    </div>
  );
}