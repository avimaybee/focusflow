
'use client';

import { ArrowRight, Book, Brain, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

const prompts = [
    {
        icon: <FileText className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary" />,
        text: 'Summarize a document',
        prompt: 'Summarize this document for me...',
    },
    {
        icon: <Book className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary" />,
        text: 'Create a study plan',
        prompt: 'Create a study plan for my history exam',
    },
    {
        icon: <Brain className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary" />,
        text: 'Brainstorm ideas',
        prompt: 'Help me brainstorm ideas for my essay on climate change',
    },
    {
        icon: <Sparkles className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary" />,
        text: 'Explain a concept',
        prompt: 'Can you explain quantum computing in simple terms?',
    }
]

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prompts.map((item, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 justify-start items-start text-left group border-border/70 hover:border-primary/50 hover:bg-secondary/50 transition-all duration-200"
              onClick={() => onSelectPrompt(item.prompt)}
            >
              <div className="flex flex-col">
                <div className="flex items-center mb-2">
                  {item.icon}
                  <span className="font-semibold text-base text-foreground ml-0">
                    {item.text}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground font-normal">
                  {item.prompt}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
