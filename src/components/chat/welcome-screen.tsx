
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
    <div className="flex flex-col items-center justify-center h-[calc(100vh-280px)] px-4">
      <div className="p-4 bg-primary/10 rounded-full mb-4 border border-primary/20">
        <Logo className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-2xl font-bold mb-1 text-center text-foreground">
        How can I help you today?
      </h1>
      <p className="text-muted-foreground mb-6">Select a prompt to get started or just start typing.</p>
      <div className="flex flex-col gap-2 w-full max-w-md">
        {prompts.map((item, index) => (
            <Button
                key={index}
                variant="ghost"
                className="h-auto p-3 justify-start group"
                onClick={() => onSelectPrompt(item.prompt)}
            >
                {item.icon}
                <span className="font-normal text-base text-muted-foreground group-hover:text-foreground">{item.text}</span>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100" />
            </Button>
        ))}
      </div>
    </div>
  );
}
