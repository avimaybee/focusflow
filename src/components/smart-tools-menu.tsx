
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { CaseUpper, ListTodo, Scale, BookText, Presentation, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <TooltipProvider>
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={cn(
            "flex items-center gap-1 rounded-full bg-card p-1 shadow-sm border",
            isOpen ? "w-auto" : "w-auto"
        )}
        onMouseLeave={() => setIsOpen(false)}
        role="toolbar"
        aria-label="Smart Tools"
      >
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <motion.div layoutId="smart-tools-button">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => setIsOpen(!isOpen)}
                            aria-label="Open Smart Tools"
                        >
                            <Sparkles className="h-4 w-4" />
                        </Button>
                    </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Smart Tools</p>
                </TooltipContent>
            </Tooltip>
        
        <AnimatePresence>
            {isOpen && (
                 <motion.div
                    className="flex items-center gap-1"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto', transition: { delay: 0.1 } }}
                    exit={{ opacity: 0, width: 0 }}
                 >
                    {smartTools.map((tool) => (
                        <Tooltip key={tool.name} delayDuration={300}>
                        <TooltipTrigger asChild>
                            <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => onAction(tool)}
                            >
                            {tool.icon}
                            <span className="sr-only">{tool.name}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{tool.name}</p>
                        </TooltipContent>
                        </Tooltip>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  );
}

    