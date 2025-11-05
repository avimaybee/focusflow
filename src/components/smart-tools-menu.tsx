
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
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

  return (
    <TooltipProvider>
      <>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-foreground/40 hover:bg-muted hover:text-foreground/70 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Smart Tools"
              aria-expanded={isOpen}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>AI Smart Tools</p>
          </TooltipContent>
        </Tooltip>

        {isOpen && (
          <>
            {smartTools.map((tool) => (
              <Button
                key={tool.name}
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 rounded-full text-xs gap-1.5 bg-muted/50 hover:bg-muted text-foreground/70 hover:text-foreground transition-colors whitespace-nowrap"
                onClick={() => {
                  onAction(tool);
                  setIsOpen(false);
                }}
                aria-label={tool.name}
              >
                {React.cloneElement(tool.icon, { className: 'h-3 w-3' })}
                <span>{tool.name}</span>
              </Button>
            ))}
          </>
        )}
      </>
    </TooltipProvider>
  );
}

    