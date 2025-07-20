
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, ArrowRight, FileText, Layers, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const DemoMessage = ({ author, children, icon: Icon, isAction = false }: { author: string, children: React.ReactNode, icon: React.ElementType, isAction?: boolean }) => (
  <motion.div
    className={cn(
      'flex items-start gap-3 mb-4',
      author === 'user' ? 'justify-start' : 'justify-start'
    )}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  >
    <div
      className={cn(
        'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center',
        author === 'user' ? 'bg-gray-300 dark:bg-gray-600' : 'bg-primary/10 border border-primary/20'
      )}
    >
      {Icon && <Icon className={cn('w-5 h-5', author === 'user' ? 'text-gray-600 dark:text-gray-300' : 'text-primary')} />}
    </div>
    <div
      className={cn(
        'relative px-4 py-3 rounded-lg max-w-[80%]',
        author === 'user'
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          : 'bg-transparent border'
      )}
    >
      {children}
    </div>
  </motion.div>
);

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex items-center gap-1 ml-12"
  >
    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0.2s]" />
    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0.4s]" />
  </motion.div>
);

const demoScript = [
  {
    type: 'user',
    icon: FileText,
    text: 'Can you summarize this article about the benefits of spaced repetition for learning?',
  },
  { type: 'ai_typing', duration: 2000 },
  {
    type: 'ai',
    icon: Sparkles,
    text: 'Of course! Spaced repetition is a learning technique that involves reviewing information at increasing intervals. The key benefits are improved long-term memory retention and more efficient studying by focusing on material you\'re about to forget.',
  },
  { type: 'ai_typing', duration: 1500 },
  {
    type: 'ai_action',
    icon: Layers,
    text: 'Now, would you like to turn this summary into flashcards?',
  },
  { type: 'user_action', text: 'Yes, create flashcards!' },
  { type: 'ai_typing', duration: 2500 },
  {
    type: 'ai_flashcards',
    icon: Zap,
    cards: [
      {
        front: 'What is spaced repetition?',
        back: 'A technique of reviewing information at increasing intervals to improve memory.',
      },
      {
        front: 'What is the main benefit?',
        back: 'Improved long-term retention and more efficient studying.',
      },
    ],
  },
];

export const InteractiveDemo = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (scriptIndex < demoScript.length && isAnimating) {
      const currentStep = demoScript[scriptIndex];
      const delay = currentStep.duration || (currentStep.type.includes('action') ? 1500 : ((currentStep as any).text ? (currentStep as any).text.length * 40 : 2000));

      const timer = setTimeout(() => {
        if (currentStep.type !== 'ai_typing') {
          setMessages((prev) => [...prev, currentStep]);
        }
        setScriptIndex((prev) => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    } else if (scriptIndex >= demoScript.length) {
      setIsAnimating(false);
    }
  }, [scriptIndex, isAnimating]);

  const isTyping = demoScript[scriptIndex]?.type === 'ai_typing';

  return (
    <Card className="w-full max-w-2xl mx-auto bg-transparent shadow-2xl shadow-primary/10 border-border/20">
      <CardContent className="p-4 md:p-6">
        <div className="h-[400px] overflow-y-auto flex flex-col-reverse pr-2">
          <AnimatePresence>
            {messages.slice().reverse().map((msg, index) => {
              if (msg.type === 'ai_flashcards') {
                return (
                  <DemoMessage key={index} author="ai" icon={msg.icon}>
                    <p className="font-semibold mb-3">Here are your flashcards:</p>
                    <div className="space-y-2">
                      {msg.cards.map((card: any, i: number) => (
                        <div key={i} className="p-3 bg-primary/10 rounded-md border border-primary/20 text-sm">
                          <p><strong>Front:</strong> {card.front}</p>
                          <p className="mt-1"><strong>Back:</strong> {card.back}</p>
                        </div>
                      ))}
                    </div>
                  </DemoMessage>
                );
              }
              return (
                <DemoMessage key={index} author={msg.type.includes('user') ? 'user' : 'ai'} icon={msg.icon}>
                  <p>{msg.text}</p>
                </DemoMessage>
              );
            })}
          </AnimatePresence>
          {isTyping && <TypingIndicator />}
        </div>
        <div className="mt-6 text-center">
          <Button size="lg" asChild className="shadow-lg animate-pulse">
            <Link href="/chat">
              Experience the Magic Yourself
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Get started for free. No credit card required.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
