'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { MessageList } from '@/components/chat/message-list';
import { ChatInputArea } from '@/components/chat/chat-input-area';
import { ChatMessageProps } from '@/components/chat-message';
import { marked } from 'marked';
import { usePersonaManager } from '@/hooks/use-persona-manager';
import { useFileUpload, Attachment } from '@/hooks/use-file-upload';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { PersonaIDs } from '@/lib/constants';

const suggestedPrompts = [
  "Explain the theory of relativity like I'm five",
  'Hit me with a 3-question quiz about the Roman Empire',
  'Summarize this for me: [Paste text here]',
  'Give me some flashcards for basic Spanish vocabulary',
];

const welcomeMessage: ChatMessageProps = {
    id: 'welcome-1',
    role: 'model',
    text: 'Hey there! I\'m FocusFlow, your AI study buddy. Think of me as that friend who\'s weirdly good at explaining things. I can help you summarize stuff, make quizzes, create flashcards, you name it. <br/><br/> So, what are we diving into today? Pick a suggestion below or just tell me what you need!',
    rawText: 'Hey there! I\'m FocusFlow, your AI study buddy. Think of me as that friend who\'s weirdly good at explaining things. I can help you summarize stuff, make quizzes, create flashcards, you name it. \n\n So, what are we diving into today? Pick a suggestion below or just tell me what you need!',
};

const limitMessage: ChatMessageProps = {
    id: 'limit-1',
    role: 'model',
    text: 'Looks like you\'re getting the hang of it! You\'ve reached the demo limit. <br/><br/> Please sign up or log in to continue our chat—it\'s free and you\'ll get access to all the features!',
    rawText: 'Looks like you\'re getting the hang of it! You\'ve reached the demo limit. \n\n Please sign up or log in to continue our chat—it\'s free and you\'ll get access to all the features!',
}

export function LandingPageChat() {
  const [messages, setMessages] = useState<ChatMessageProps[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const { toast } = useToast();
  const { personas, selectedPersona, selectedPersonaId, setSelectedPersonaId } = usePersonaManager(PersonaIDs.CASUAL);
  const { isDraggingOver, handleFileSelect, fileUploadHandlers } = useFileUpload(setAttachment);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const authModal = useAuthModal();

  useEffect(() => {
    if (scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')) {
      const scrollableView = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')!;
      scrollableView.scrollTo({ top: scrollableView.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: FormEvent, prompt?: string) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const messageToSend = prompt || input;
    if (!messageToSend.trim() && !attachment || isSending) return;

    if (guestMessageCount >= 5) {
        setMessages(prev => [...prev, limitMessage]);
        authModal.onOpen('signup');
        setInput('');
        return;
    }

    setShowSuggestions(false);
    setIsSending(true);

    const userMessage: ChatMessageProps = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: await marked.parse(messageToSend.trim()),
      rawText: messageToSend.trim(),
      userName: 'Guest',
      userAvatar: null,
    };
    setMessages(prev => [...prev, userMessage]);
    setGuestMessageCount(prev => prev + 1);

    const chatInput = {
      message: messageToSend.trim(),
      personaId: selectedPersonaId,
      context: attachment?.url,
    };

    setInput('');
    setAttachment(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatInput),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'An unknown error occurred.');
      }

      const modelResponse: ChatMessageProps = {
        id: `guest-ai-${Date.now()}`,
        role: 'model',
        text: await marked.parse(result.response),
        rawText: result.response,
        flashcards: result.flashcards,
        quiz: result.quiz,
        source: result.source,
        confidence: result.confidence,
        persona: selectedPersona || undefined,
      };
      setMessages(prev => [...prev, modelResponse]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Message Failed',
        description: error.message,
      });
      const errorResponse: ChatMessageProps = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `<p>Sorry, there was an error. Please try again.</p>`,
        rawText: `Sorry, there was an error. Please try again.`,
        isError: true,
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsSending(false);
    }
  };
  
  const handleSuggestionClick = (prompt: string) => {
    if (prompt.includes('[Paste text here]')) {
        setInput(prompt);
    } else {
        handleSendMessage({} as FormEvent, prompt);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto" {...fileUploadHandlers}>
      <div className="bg-background rounded-lg border shadow-xl flex flex-col h-[600px]">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            Interactive Demo
          </h2>
          <p className="text-sm text-muted-foreground">
            See how FocusFlow AI can accelerate your learning. (Demo limited to 5 messages)
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <MessageList 
            messages={messages} 
            isSending={isSending} 
            scrollAreaRef={scrollAreaRef}
            onSmartToolAction={(prompt) => {
                const syntheticEvent = {} as FormEvent;
                handleSendMessage(syntheticEvent, prompt);
            }}
          />
        </div>
        
        <div className="p-4 border-t bg-background/50">
            <AnimatePresence>
            {showSuggestions && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        {suggestedPrompts.map((prompt, i) => (
                            <Button
                                key={i}
                                variant="outline"
                                size="sm"
                                className="text-left justify-start h-auto whitespace-normal"
                                onClick={() => handleSuggestionClick(prompt)}
                            >
                                {prompt}
                            </Button>
                        ))}
                    </div>
                     <div className="relative flex items-center justify-center my-3">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-background/50 px-2 text-xs uppercase text-muted-foreground">
                            Or
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>

            <motion.div
                className="flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="w-full max-w-4xl">
                <ChatInputArea
                    input={input}
                    setInput={setInput}
                    handleSendMessage={handleSendMessage}
                    handleFileSelect={handleFileSelect}
                    isSending={isSending}
                    isHistoryLoading={false}
                    personas={personas}
                    selectedPersonaId={selectedPersonaId}
                    setSelectedPersonaId={setSelectedPersonaId}
                    activeChatId={null}
                    chatContext={attachment}
                    clearChatContext={() => setAttachment(null)}
                    placeholder="Type your own message..."
                />
              </div>
            </motion.div>
        </div>
      </div>
    </div>
  );
}