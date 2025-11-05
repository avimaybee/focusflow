
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CaseUpper, ListTodo, Scale, BookText, Presentation, Sparkles, ChevronUp } from 'lucide-react';
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
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <TooltipProvider>
      <div ref={containerRef} className="relative">
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 rounded-md text-foreground/40 hover:bg-muted hover:text-foreground/70 transition-colors",
                isOpen && "bg-muted text-foreground/70"
              )}
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
          <div className="absolute bottom-full right-0 mb-2 w-max bg-background border border-border/60 rounded-lg shadow-lg p-1 z-50">
            <div className="flex flex-col gap-1">
              {smartTools.map((tool) => (
                <Button
                  key={tool.name}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 rounded-md text-xs gap-2 text-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors justify-start"
                  onClick={() => {
                    onAction(tool);
                    setIsOpen(false);
                  }}
                  aria-label={tool.name}
                >
                  {React.cloneElement(tool.icon, { className: 'h-3 w-3 flex-shrink-0' })}
                  <span>{tool.name}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

    