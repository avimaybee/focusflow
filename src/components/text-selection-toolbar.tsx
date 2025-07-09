
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bot, List, MessageSquare, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextSelectionToolbarProps {
  selectionData: { text: string; rect: DOMRect } | null;
  onAction: (promptTemplate: string) => void;
}

const tools = [
  {
    name: 'Explain',
    icon: <Bot className="h-4 w-4" />,
    prompt: 'Explain this concept in simple terms: "[SELECTED_TEXT]"',
  },
  {
    name: 'Summarize',
    icon: <List className="h-4 w-4" />,
    prompt: 'Summarize the key points of this text: "[SELECTED_TEXT]"',
  },
  {
    name: 'Rephrase',
    icon: <MessageSquare className="h-4 w-4" />,
    prompt: 'Rephrase this to be clearer and more concise: "[SELECTED_TEXT]"',
  },
  {
    name: 'Elaborate',
    icon: <Sparkles className="h-4 w-4" />,
    prompt: 'Elaborate on this point: "[SELECTED_TEXT]"',
  },
];


export function TextSelectionToolbar({ selectionData, onAction }: TextSelectionToolbarProps) {
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  React.useLayoutEffect(() => {
    if (selectionData && toolbarRef.current) {
      const { rect } = selectionData;
      const toolbarRect = toolbarRef.current.getBoundingClientRect();
      
      const top = window.scrollY + rect.top - toolbarRect.height - 8;
      let left = window.scrollX + rect.left + rect.width / 2 - toolbarRect.width / 2;

      // Prevent going off-screen
      left = Math.max(8, Math.min(left, window.innerWidth - toolbarRect.width - 8));

      setPosition({ top, left });
    }
  }, [selectionData]);
  
  const isOpen = !!selectionData;

  return (
    <TooltipProvider>
      <div
        ref={toolbarRef}
        role="toolbar"
        aria-label="Text formatting"
        className={cn(
            "absolute z-50 flex items-center gap-1 rounded-full bg-card p-1 shadow-lg border transition-opacity duration-200",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        {tools.map((tool) => (
            <Tooltip key={tool.name} delayDuration={300}>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onAction(tool.prompt)}>
                        {tool.icon}
                        <span className="sr-only">{tool.name}</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tool.name}</p>
                </TooltipContent>
            </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
