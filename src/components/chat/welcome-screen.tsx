
'use client';

import { useMemo } from 'react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

const allPrompts = [
  'Summarize this document for me...',
  'Create a study plan for my history exam',
  'Help me brainstorm ideas for my essay on climate change',
  'Can you explain quantum computing in simple terms?',
  'Generate flashcards from my biology notes',
  'Help me understand calculus derivatives step by step',
  'Create a quiz to test my knowledge on the Civil War',
  'Explain the difference between mitosis and meiosis',
  'Help me outline my research paper on renewable energy',
  'What are the key themes in Shakespeare\'s Macbeth?',
  'Teach me the basics of organic chemistry',
  'Help me practice for my Spanish vocabulary test',
  'Explain how machine learning algorithms work',
  'Create a study schedule for finals week',
  'Help me memorize the periodic table elements',
  'What\'s the best way to approach solving physics problems?',
];

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export function WelcomeScreen({ onSelectPrompt }: WelcomeScreenProps) {
  // Generate random prompts on mount and keep them stable
  const suggestedPrompts = useMemo(() => {
    return shuffleArray(allPrompts).slice(0, 4);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-4">
      <div className="text-center w-full max-w-2xl mx-auto">
        <div className="inline-block p-2.5 bg-card rounded-full mb-3 border-2 border-border/60">
          <Logo className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1.5 text-foreground leading-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
          How can I help you today?
        </h1>
        <p className="text-base text-foreground/70 mb-6 font-normal">
          Select a starting point below, or just begin typing.
        </p>

        <div className="mt-4 space-y-3 text-left">
           {/* Minimal header for suggested starters */}
           <div className="relative">
              <div className="mb-2.5">
                <h4 className="text-xs font-semibold text-foreground/60 uppercase tracking-wider text-center">
                  Suggested Prompts
                </h4>
              </div>              {/* Lightweight prompt buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => onSelectPrompt(prompt)}
                    className="group text-left p-2.5 rounded-lg bg-primary/10 hover:bg-primary/15 border border-border/40 hover:border-border/60 transition-all duration-150 hover:shadow-md"
                  >
                    <div className="flex items-start gap-2.5 w-full">
                      <Sparkles className="h-3.5 w-3.5 mt-0.5 text-primary/80 flex-shrink-0 group-hover:text-primary transition-colors duration-150" />
                      <span className="text-foreground/75 group-hover:text-foreground transition-colors duration-150 text-sm font-normal leading-snug">{prompt}</span>
                    </div>
                  </button>
                  ))}
              </div>
          </div>
        </div>

        {/* Subtle helper text */}
        <p className="mt-5 text-xs text-foreground/50 text-center font-medium">
          Or type your own question to get started
        </p>
      </div>
    </div>
  );
}
