'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface SuggestedPromptsProps {
  suggestions: string[];
  onPromptSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ suggestions, onPromptSelect }: SuggestedPromptsProps) {
  return (
    <motion.div 
      className="mt-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
    >
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        Suggested Follow-ups
      </h4>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((prompt, index) => (
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
    </motion.div>
  );
}
