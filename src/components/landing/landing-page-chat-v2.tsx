'use client';

import { useState, FormEvent, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { marked } from 'marked';
import { usePersonaManager } from '@/hooks/use-persona-manager';
import { Button } from '@/components/ui/button';
import { PersonaSelector } from '@/components/chat/persona-selector';
import {
    Send,
    Sparkles,
    Bot,
    User,
} from 'lucide-react';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { PersonaIDs } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ChatMessageProps } from '@/components/chat/chat-message';

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
};

const limitMessage: ChatMessageProps = {
    id: 'limit-1',
    role: 'model',
    text: 'Looks like you\'re getting the hang of it! You\'ve reached the demo limit. <br/><br/> Please sign up or log in to continue our chat—it\'s free and you\'ll get access to all the features!',
}

const Message = ({ message }: { message: ChatMessageProps }) => {
    const isModel = message.role === 'model';
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('flex items-start gap-3 mb-6', !isModel && 'justify-end')}
        >
            {isModel && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    <Bot size={20} />
                </div>
            )}
            <div
                className={cn(
                    'p-3 rounded-lg max-w-lg prose prose-sm',
                    isModel ? 'bg-muted' : 'bg-primary text-primary-foreground'
                )}
                dangerouslySetInnerHTML={{ __html: typeof message.text === 'string' ? message.text : '' }}
            ></div>
             {!isModel && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                    <User size={20} />
                </div>
            )}
        </motion.div>
    );
};

const ThinkingIndicator = ({ personaName }: { personaName: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-start gap-3 mb-6"
    >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <Bot size={20} />
        </div>
        <div className="p-3 rounded-lg bg-muted">
            <div className="font-sans font-bold text-muted-foreground">
                {(personaName + " is thinking...").split("").map((char, i) => (
                    <motion.span
                    key={i}
                    className="inline-block"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatType: "loop",
                        delay: i * 0.05,
                        ease: "easeInOut",
                        repeatDelay: 2,
                    }}
                    >
                    {char === " " ? "\u00A0" : char}
                    </motion.span>
                ))}
            </div>
        </div>
    </motion.div>
);


export function LandingPageChatV2() {
  const [messages, setMessages] = useState<ChatMessageProps[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  // Generate new sessionId and guestId for each page load (ephemeral guest chat)
  const [sessionId] = useState<string>(uuidv4());
  const [guestId] = useState<string>(uuidv4());
  const { toast } = useToast();
  
  // Select a random persona on page load for the demo
  const [randomPersonaId] = useState(() => {
    const personaIds = Object.values(PersonaIDs);
    return personaIds[Math.floor(Math.random() * personaIds.length)];
  });
  
  const { personas, selectedPersona, selectedPersonaId, setSelectedPersonaId, isLoading } = usePersonaManager(randomPersonaId);
  const authModal = useAuthModal();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Debug: log personas when they load
  useEffect(() => {
    console.log('Landing page personas loaded:', personas.length, personas);
  }, [personas]);

  // Removed auto-scrolling behavior as per user request.

  const handleSendMessage = async (e: FormEvent, prompt?: string) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    
    const messageToSend = prompt || input;
    if (!messageToSend.trim() || isSending || limitReached) return;

    if (guestMessageCount >= 5) {
        setMessages(prev => [...prev, limitMessage]);
        authModal.onOpen('signup');
        setInput('');
        setLimitReached(true);
        return;
    }

    setShowSuggestions(false);
    setIsSending(true);

    const userMessage: ChatMessageProps = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: await marked.parse(messageToSend.trim()),
    };
    setMessages(prev => ([...(prev || []), userMessage]));
    setGuestMessageCount(prev => prev + 1);

    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: messageToSend.trim(), 
          personaId: selectedPersonaId,
          sessionId: sessionId, // Pass sessionId
          guestId: guestId,     // Pass guestId
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'An unknown error occurred.');

      const modelResponse: ChatMessageProps = {
        id: `guest-ai-${Date.now()}`,
        role: 'model',
        text: await marked.parse(result.response),
      };
    setMessages(prev => ([...(prev || []), modelResponse]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Message Failed', description: error.message });
      const errorResponse: ChatMessageProps = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `<p>Sorry, there was an error. Please try again.</p>`,
      };
    setMessages(prev => ([...(prev || []), errorResponse]));
    } finally {
      setIsSending(false);
    }
  };
  
  const handleSuggestionClick = useCallback((prompt: string) => {
    if (prompt.includes('[Paste text here]')) {
        setInput(prompt.replace('[Paste text here]', ''));
    } else {
        handleSendMessage({} as FormEvent, prompt);
    }
  }, [handleSendMessage, setInput]);

  return (
    <div className="w-full max-w-4xl mx-auto bg-background rounded-lg border shadow-xl flex flex-col h-[70vh] min-h-[500px]">
        <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-primary" />
                Interactive Demo
            </h2>
            <p className="text-sm text-muted-foreground">
                See how FocusFlow AI can accelerate your learning. (Demo limited to 5 messages)
            </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => <Message key={msg.id} message={msg} />)}
            <AnimatePresence>
                {isSending && <ThinkingIndicator personaName={selectedPersona?.name || 'AI Assistant'} />}
            </AnimatePresence>
            <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t bg-background/50">
            <AnimatePresence>
                {showSuggestions && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-3"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {suggestedPrompts.map((prompt, i) => (
                                <Button key={i} variant="outline" size="sm" className="text-left justify-start h-auto whitespace-normal" onClick={() => handleSuggestionClick(prompt)}>
                                    {prompt}
                                </Button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <PersonaSelector
                    personas={personas}
                    selectedPersonaId={selectedPersonaId}
                    onSelect={setSelectedPersonaId}
                    variant="compact"
                    className="rounded-full flex-shrink-0 text-muted-foreground hover:bg-muted"
                    disabled={isLoading}
                />
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 w-full px-4 py-2 bg-muted rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isSending || limitReached}
                />
                <Button type="submit" size="icon" className="rounded-full" disabled={isSending || !input.trim() || limitReached}>
                    <Send className="h-5 w-5" />
                </Button>
            </form>
        </div>
    </div>
  );
}