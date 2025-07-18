
'use client';

import { Logo } from '@/components/logo';
import { SuggestedPrompts } from './suggested-prompts';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

const genericPrompts = [
  'Summarize this document for me...',
  'Create a study plan for my history exam',
  'Help me brainstorm ideas for my essay on climate change',
  'Can you explain quantum computing in simple terms?',
];

// TODO: Replace with real data from the backend
const personalizedPrompts = [
    'Create flashcards from my "Photosynthesis" summary',
    'Quiz me on "The Roman Empire"',
    'Continue my study plan for "Calculus II"',
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
        
        <SuggestedPrompts 
            suggestions={genericPrompts}
            personalizedSuggestions={personalizedPrompts}
            onPromptSelect={onSelectPrompt}
        />
      </div>
    </div>
  );
}
