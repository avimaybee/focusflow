'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Send, Sparkles, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { Textarea } from './textarea';
import { useToast } from '@/hooks/use-toast';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { marked } from 'marked';

// --- Component Parts ---

const WidgetHeader = ({ onClose }: { onClose: () => void }) => (
  <div className="flex items-center justify-between p-3 border-b border-primary/20">
    <div className="flex items-center gap-2">
      <Sparkles className="h-5 w-5 text-primary" />
      <h3 className="font-semibold text-sm">FocusFlow AI Preview</h3>
    </div>
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
      <X className="h-4 w-4" />
    </Button>
  </div>
);

const MessageBubble = ({ message }: { message: { role: 'user' | 'assistant'; content: string } }) => {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2 text-sm prose prose-sm prose-invert',
          isUser ? 'bg-[#3c4b68] text-white' : 'bg-[#232b3b] text-gray-100'
        )}
      >
        <div dangerouslySetInnerHTML={{ __html: message.content }} />
      </motion.div>
    </div>
  );
};

const SuggestionPill = ({ text, onClick }: { text: string; onClick: (prompt: string) => void }) => (
  <button
    onClick={() => onClick(text)}
    className="px-3 py-1.5 bg-[#232b3b] hover:bg-[#3c4b68] transition-colors rounded-full text-xs text-gray-200"
  >
    {text}
  </button>
);

const SignUpPrompt = () => (
    <div className="text-center p-4">
        <p className="text-sm font-medium">Want to save this chat?</p>
        <p className="text-xs text-muted-foreground mb-3">Sign up to unlock unlimited messages and save your content.</p>
        <Button asChild className="w-full">
            <Link href="/chat">Get Started for Free</Link>
        </Button>
    </div>
)

// --- Main Widget Component ---

export function PreviewChatWidget({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [limitRemaining, setLimitRemaining] = useState(3);
  const [isSending, setIsSending] = useState(false);
  const [guestUser, setGuestUser] = useState<User | null>(null);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    "Generate three counterarguments for the thesis: 'The widespread adoption of social media has led to a more politically polarized society.'",
    "Create a 3-day study plan for a final exam on Macroeconomics, covering topics like GDP, inflation, and monetary policy.",
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            setGuestUser(user);
        } else {
            signInAnonymously(auth).catch((error) => {
                console.error("Anonymous sign-in failed:", error);
                toast({ variant: 'destructive', title: 'Preview Error', description: 'Could not start a preview session.' });
            });
        }
    });
    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: FormEvent, prompt?: string) => {
    e.preventDefault();
    const messageContent = prompt || input;
    if (!messageContent.trim() || isSending || limitRemaining === 0 || !guestUser) return;

    setIsSending(true);
    setMessages(prev => [...prev, { role: 'user', content: messageContent }]);
    setInput('');

    try {
        const idToken = await guestUser.getIdToken();
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ 
              message: messageContent, 
              userId: guestUser.uid,
              personaId: 'casual' // Explicitly set the persona for the preview
            }),
        });

        if (!response.ok) {
            throw new Error('The AI is feeling a bit shy. Please try again.');
        }

        const result = await response.json();
        
        const rawResponse = result.response || "Sorry, I couldn't think of anything to say!";
        const htmlResponse = await marked.parse(rawResponse);
        
        setMessages(prev => [...prev, { role: 'assistant', content: htmlResponse }]);
        setLimitRemaining(prev => prev - 1);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
        setMessages(prev => prev.slice(0, -1));
    } finally {
        setIsSending(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    const syntheticEvent = { preventDefault: () => {} } as FormEvent;
    handleSendMessage(syntheticEvent, prompt);
  };

  return (
    <div className="fixed bottom-20 right-5 z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="w-[380px] h-[520px] bg-[#1B1F23] border border-primary/40 rounded-lg shadow-2xl flex flex-col"
      >
        <WidgetHeader onClose={onClose} />
        
        <div ref={scrollAreaRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
          <AnimatePresence>
            {messages.map((msg, index) => (
              <MessageBubble key={index} message={msg} />
            ))}
          </AnimatePresence>
        </div>

        <div className="p-3 border-t border-primary/20">
          {limitRemaining > 0 ? (
            <>
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {samplePrompts.map(prompt => (
                    <SuggestionPill key={prompt} text={prompt} onClick={handlePromptClick} />
                  ))}
                </div>
              )}
              <form onSubmit={handleSendMessage}>
                <div className="relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me something..."
                    className="pr-12 resize-none"
                    rows={2}
                    disabled={isSending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="absolute bottom-2 right-2 h-8 w-8"
                    disabled={isSending || !input.trim()}
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </form>
              <div className="text-center text-xs text-muted-foreground mt-2">
                <p>You have {limitRemaining} message{limitRemaining !== 1 ? 's' : ''} left in this preview.</p>
              </div>
            </>
          ) : (
            <SignUpPrompt />
          )}
        </div>
      </motion.div>
    </div>
  );
}
