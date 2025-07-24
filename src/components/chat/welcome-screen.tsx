
'use client';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

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
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground tracking-tight">
          How can I help you today?
        </h1>
        <p className="text-lg text-muted-foreground mb-10">
          Select a starting point below, or just begin typing.
        </p>
        
        <div className="mt-4 space-y-6 text-left">
           <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Suggested Starters
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestedPrompts.map((prompt, index) => (
                  <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectPrompt(prompt)}
                      className="text-left h-auto justify-start p-3"
                  >
                      {prompt}
                  </Button>
                  ))}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
