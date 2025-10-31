
'use client';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

const suggestedPrompts = [
  'Summarize this document for me...',
  'Create a study plan for my history exam',
  'Help me brainstorm ideas for my essay on climate change',
  'Can you explain quantum computing in simple terms?',
];

export function WelcomeScreen({ onSelectPrompt }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8">
      <div className="text-center w-full max-w-2xl mx-auto">
        <div className="inline-block p-4 bg-primary/10 rounded-full mb-6 border border-primary/20 shadow-sm">
          <Logo className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3 text-foreground leading-tight tracking-tight">
          How can I help you today?
        </h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Select a starting point below, or just begin typing.
        </p>
        
        <div className="mt-6 space-y-6 text-left">
           {/* Enhanced visual prominence for suggested starters */}
           <div className="relative">
              {/* Attention-grabbing header with gradient */}
              <div className="mb-5 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-lg blur-xl"></div>
                <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-2 border-primary/30 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-3">
                    <Zap className="h-5 w-5 text-primary animate-pulse" />
                    <h4 className="text-base font-bold text-foreground uppercase tracking-wide">
                      Try These Prompts to Get Started
                    </h4>
                    <Zap className="h-5 w-5 text-primary animate-pulse" />
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    Click any prompt below to see what I can do
                  </p>
                </div>
              </div>
              
              {/* Enhanced prompt cards with stronger visual appeal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {suggestedPrompts.map((prompt, index) => (
                  <div key={index} className="relative group">
                    {/* Glowing effect on hover */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => onSelectPrompt(prompt)}
                      className="relative w-full text-left h-auto justify-start p-5 leading-relaxed font-medium bg-card border-2 border-primary/50 hover:border-primary hover:bg-primary/5 shadow-md hover:shadow-xl transition-all duration-300 group"
                    >
                      <div className="flex items-start gap-3 w-full">
                        <Sparkles className="h-5 w-5 mt-0.5 text-primary flex-shrink-0 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
                        <span className="text-foreground group-hover:text-primary transition-colors duration-300">{prompt}</span>
                      </div>
                      {/* Subtle indicator arrow */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Button>
                  </div>
                  ))}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
