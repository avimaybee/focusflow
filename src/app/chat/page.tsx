
'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { usePersonaManager } from '@/hooks/use-persona-manager';
import { useChatHistory } from '@/hooks/use-chat-history';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { useChatReducer } from '@/hooks/use-chat-reducer';
import { useFileUpload, Attachment } from '@/hooks/use-file-upload';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageList } from '@/components/chat/message-list';
import { ChatInputArea } from '@/components/chat/chat-input-area';
import { Loader2, UploadCloud } from 'lucide-react';
import {
  doc,
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  onSnapshot,
  deleteField,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { chat } from '@/ai/flows/chat-flow';
import { rewriteText } from '@/ai/flows/rewrite-text';
import { generateBulletPoints } from '@/ai/flows/generate-bullet-points';
import { generateCounterarguments } from '@/ai/flows/generate-counterarguments';
import { generatePresentationOutline } from '@/ai/flows/generate-presentation-outline';
import { highlightKeyInsights } from '@/ai/flows/highlight-key-insights';
import type {
  ChatInput,
  ChatHistoryMessage,
  Persona,
} from '@/ai/flows/chat-types';
import {ChatMessageProps} from '@/components/chat-message';
import {SmartToolActions} from '@/lib/constants';
import {AnnouncementBanner} from '@/components/announcement-banner';

type ChatContext = {
  name: string;
  type: string;
  url: string; // data URI
} | null;

export default function ChatPage() {
  const { user, isPremium, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [chatContext, setChatContext] = useState<ChatContext>(null);
  
  const [state, dispatch] = useChatReducer();
  const { messages, isLoading, attachments } = state;

  const { personas, selectedPersona, selectedPersonaId, setSelectedPersonaId } = usePersonaManager();
  const { chatHistory } = useChatHistory();
  const { isHistoryLoading } = useChatMessages(activeChatId, dispatch);
  const { isDraggingOver, handleFileSelect, fileUploadHandlers } = useFileUpload(dispatch);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const chatIdFromParams = params.chatId as string | undefined;
    setActiveChatId(chatIdFromParams || null);
  }, [params]);

  // Effect to load and listen for persistent context on the active chat
  useEffect(() => {
    if (user?.uid && activeChatId) {
      const chatRef = doc(db, 'users', user.uid, 'chats', activeChatId);
      const unsubscribe = onSnapshot(chatRef, (doc) => {
        if (doc.exists() && doc.data().context) {
          setChatContext(doc.data().context as ChatContext);
        } else {
          setChatContext(null);
        }
      });
      return () => unsubscribe();
    } else {
      setChatContext(null);
    }
  }, [activeChatId, user?.uid]);
  
  const clearChatContext = async () => {
    if (user?.uid && activeChatId) {
      const chatRef = doc(db, 'users', user.uid, 'chats', activeChatId);
      await updateDoc(chatRef, { context: deleteField() });
    }
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
    dispatch({ type: 'SET_MESSAGES', payload: [] });
    router.push('/chat');
  };

  const submitMessage = async (prompt: string, attachedFiles: Attachment[]) => {
    if ((!prompt.trim() && attachedFiles.length === 0) || isLoading || !user?.uid) return;
    
    // Add logic to retain context when a file is uploaded
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    let finalPrompt = prompt;

    const modelNeedsContext = lastMessage?.role === 'model' &&
                              (lastMessage.text?.toString().toLowerCase().includes('please provide') || 
                               lastMessage.text?.toString().toLowerCase().includes('what text') ||
                               lastMessage.text?.toString().toLowerCase().includes('upload the document'));

    const userIsProvidingFile = attachedFiles.length > 0;

    if (modelNeedsContext && userIsProvidingFile) {
      const lastUserRequest = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserRequest?.text) {
        // Create a more explicit prompt for the AI to ensure context is not lost.
        finalPrompt = `The user's original request was: "${lastUserRequest.text}". They have now uploaded a file to provide the necessary context. Please proceed with the original request using the provided file content. The user's latest message was: "${prompt}".`;
      }
    }

    const userMessage: ChatMessageProps = {
      role: 'user',
      text: prompt, // Display the user's actual input in the UI
      images: attachedFiles.filter(f => f.type.startsWith('image/')).map(f => f.url),
      userAvatar: user?.photoURL,
      userName: user?.displayName || user?.email || 'User',
    };

    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'START_LOADING' });
    setInput('');
    dispatch({ type: 'CLEAR_ATTACHMENTS' });

    let currentChatId = activeChatId;

    try {
      // If this is the first message, create the chat document first
      if (!currentChatId) {
        const chatDoc = await addDoc(collection(db, 'users', user.uid, 'chats'), {
          title: prompt.split(' ').slice(0, 5).join(' ').substring(0, 40) || 'New Chat',
          createdAt: serverTimestamp(),
          context: null, // Initialize context as null
        });
        currentChatId = chatDoc.id;
        router.push(`/chat/${currentChatId}`, { scroll: false });
        setActiveChatId(currentChatId);
      }

      // If there are attachments, persist the first one as the chat's context
      if (attachedFiles.length > 0 && currentChatId) {
        const fileContext = {
          name: attachedFiles[0].name,
          type: attachedFiles[0].type,
          url: attachedFiles[0].url, // Save the data URI
        };
        await updateDoc(doc(db, 'users', user.uid, 'chats', currentChatId), { context: fileContext });
        setChatContext(fileContext); // Update local state immediately
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

      // Determine the context to send to the AI, prioritizing new attachments
      const contextAttachment = attachedFiles.length > 0 ? attachedFiles[0] : chatContext;
      let fileDataUri: string | undefined;
      if (contextAttachment) {
          fileDataUri = contextAttachment.url; // url is the data URI now
      }
      
      const chatInput: ChatInput = {
        userId: user.uid,
        message: finalPrompt.trim(),
        persona: selectedPersonaId as Persona,
        history: chatHistoryForAI,
        isPremium: isPremium ?? false,
        context: fileDataUri, // Pass the data URI
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
      dispatch({ type: 'ROLLBACK_MESSAGE' });
    } finally {
      dispatch({ type: 'STOP_LOADING' });
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

    dispatch({ type: 'START_LOADING' });
    dispatch({ type: 'ADD_MESSAGE', payload: { role: 'user', text: userPrompt }});

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
        case SmartToolActions.REWRITE:
          actionFn = rewriteText({ textToRewrite: messageText, style: tool.value, persona: selectedPersonaId as Persona });
          formatResult = (result) => result.rewrittenText;
          break;
        case SmartToolActions.BULLET_POINTS:
          actionFn = generateBulletPoints({textToConvert: messageText, persona: selectedPersonaId as Persona });
          formatResult = (result) => result.bulletPoints.map((pt: string) => `- ${pt}`).join('\n');
          break;
        case SmartToolActions.COUNTERARGUMENTS:
          actionFn = generateCounterarguments({ statementToChallenge: messageText, persona: selectedPersonaId as Persona });
          formatResult = (result) => result.counterarguments.map((arg: string, i: number,) => `${i + 1}. ${arg}`).join('\n\n');
          break;
        case SmartToolActions.PRESENTATION:
          actionFn = generatePresentationOutline(sourceArg);
          formatResult = (result) => {
            let outlineString = `## ${result.title}\n\n`;
            result.slides.forEach((slide: any, index: number,) => {
              outlineString += `### **Slide ${index + 1}: ${slide.title}**\n`;
              slide.bulletPoints.forEach((point: string) => outlineString += `- ${point}\n`);
              outlineString += '\n';
            });
            return outlineString;
          };
          break;
        case SmartToolActions.INSIGHTS:
          actionFn = highlightKeyInsights(sourceArg);
          formatResult = (result) => {
            let insightsString = '### Key Insights\n\n';
            result.insights.forEach((insight: string,) => insightsString += `- ${insight}\n`);
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
      dispatch({ type: 'ROLLBACK_MESSAGE' });
    } finally {
      dispatch({ type: 'STOP_LOADING' });
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
          personaName={selectedPersona?.name || 'Default'}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          isLoggedIn={!!user}
        />
        
        <AnnouncementBanner />

        <MessageList
          messages={messages}
          isLoading={isLoading}
          isHistoryLoading={isHistoryLoading}
          activeChatId={activeChatId}
          scrollAreaRef={scrollAreaRef}
          onSelectPrompt={handleSelectPrompt}
          onSmartToolAction={handleSmartToolAction}
        />

        <div className="p-4">
          <ChatInputArea
            input={input}
            setInput={setInput}
            attachments={attachments}
            dispatch={dispatch}
            handleSendMessage={handleSendMessage}
            handleFileSelect={handleFileSelect}
            onSelectPrompt={onSelectPrompt}
            isLoading={isLoading}
            isHistoryLoading={isHistoryLoading}
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
