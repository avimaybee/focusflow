
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { CaseUpper, ListTodo, Scale, BookText, Presentation, Sparkles } from 'lucide-react';

export type SmartTool = {
  name: string;
  prompt: (text: string) => string;
  icon: React.ReactElement;
};

export const smartTools: SmartTool[] = [
  {
    name: 'Rewrite Text',
    prompt: (text) => `Rewrite the following text to be clearer and more concise: "${text}"`,
    icon: <CaseUpper className="h-4 w-4" />,
  },
  {
    name: 'To Bullet Points',
    prompt: (text) => `Convert the following text into a list of key bullet points: "${text}"`,
    icon: <ListTodo className="h-4 w-4" />,
  },
  {
    name: 'Find Counterarguments',
    prompt: (text) => `Generate 3 strong counterarguments to the following statement: "${text}"`,
    icon: <Scale className="h-4 w-4" />,
  },
  {
    name: 'Highlight Key Insights',
    prompt: (text) => `Analyze the following text and identify the key insights or "aha" moments: "${text}"`,
    icon: <BookText className="h-4 w-4" />,
  },
  {
    name: 'Create Presentation Outline',
    prompt: (text) => `Create a 12-slide presentation outline for the topic: "${text}"`,
    icon: <Presentation className="h-4 w-4" />,
  },
];

interface SmartToolsMenuProps {
  onAction: (tool: SmartTool) => void;
}

export function SmartToolsMenu({ onAction }: SmartToolsMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <TooltipProvider>
      <motion.div
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex items-center gap-1"
        ref={containerRef}
        role="toolbar"
        aria-label="Smart Tools"
      >
        <div className="flex items-center gap-1 rounded-full bg-card p-1 shadow-sm border">
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Open Smart Tools"
                aria-expanded={isOpen}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Smart Tools</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <AnimatePresence>
            {isOpen && (
              <motion.div
                className="flex flex-wrap items-center gap-1 max-w-md"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                {smartTools.map((tool) => (
                  <Button
                    key={tool.name}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 rounded-full text-xs gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => {
                      onAction(tool);
                      setIsOpen(false);
                    }}
                    aria-label={tool.name}
                  >
                    {tool.icon}
                    <span>{tool.name}</span>
                  </Button>
                ))}
              </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  );
}

    