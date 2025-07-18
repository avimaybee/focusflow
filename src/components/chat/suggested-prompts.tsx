'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, BrainCircuit } from 'lucide-react';

interface SuggestedPromptsProps {
  suggestions: string[];
  personalizedSuggestions?: string[];
  onPromptSelect: (prompt: string) => void;
}

const PromptList = ({ prompts, onPromptSelect }) => (
  <div className="flex flex-wrap gap-2">
    {prompts.map((prompt, index) => (
      <Button
        key={index}
        variant="outline"
        size="sm"
        onClick={() => onPromptSelect(prompt)}
        className="text-left h-auto"
      >
        {prompt}
      </Button>
    ))}
  </div>
);

export function SuggestedPrompts({
  suggestions,
  personalizedSuggestions,
  onPromptSelect,
}: SuggestedPromptsProps) {
  return (
    <motion.div
      className="mt-4 space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
    >
      {personalizedSuggestions && personalizedSuggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
            <BrainCircuit className="h-4 w-4 text-primary" />
            For You
          </h4>
          <PromptList prompts={personalizedSuggestions} onPromptSelect={onPromptSelect} />
        </div>
      )}
      
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Suggested Follow-ups
        </h4>
        <PromptList prompts={suggestions} onPromptSelect={onPromptSelect} />
      </div>
    </motion.div>
  );
}
