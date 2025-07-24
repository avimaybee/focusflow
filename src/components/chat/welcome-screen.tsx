
'use client';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Sparkles, BrainCircuit } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

const genericPrompts = [
  'Summarize this document for me...',
  'Create a study plan for my history exam',
  'Help me brainstorm ideas for my essay on climate change',
  'Can you explain quantum computing in simple terms?',
];

const PromptList = ({ title, prompts, onSelectPrompt, icon: Icon }: { title: string, prompts: string[], onSelectPrompt: (prompt: string) => void, icon: React.ElementType }) => (
    <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
            <Icon className="h-4 w-4 text-primary" />
            {title}
        </h4>
        <div className="flex flex-wrap gap-2">
            {prompts.map((prompt, index) => (
            <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onSelectPrompt(prompt)}
                className="text-left h-auto"
            >
                {prompt}
            </Button>
            ))}
        </div>
    </div>
);


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
        
        <div className="mt-4 space-y-6">
            <PromptList 
                title="Suggested Starters"
                prompts={genericPrompts}
                onSelectPrompt={onSelectPrompt}
                icon={Sparkles}
            />
        </div>
      </div>
    </div>
  );
}
