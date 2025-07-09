
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bot, List, Sparkles, Quote, ListTodo, Scale, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const tools = [
  {
    name: 'Explain',
    action: 'prompt',
    value: 'Explain the main ideas in this text in simple terms: "[SELECTED_TEXT]"',
    icon: <Bot className="h-4 w-4" />,
  },
  {
    name: 'Summarize',
    action: 'prompt',
    value: 'Summarize the key points of this text: "[SELECTED_TEXT]"',
    icon: <List className="h-4 w-4" />,
  },
  {
    name: 'Improve',
    action: 'rewrite',
    value: 'clearer and more concise',
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    name: 'Elaborate',
    action: 'prompt',
    value: 'Elaborate on the main points in this text, providing more detail or examples: "[SELECTED_TEXT]"',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    name: 'Add Citations',
    action: 'addCitations',
    value: 'APA',
    icon: <Quote className="h-4 w-4" />,
  },
  {
    name: 'To Bullets',
    action: 'bulletPoints',
    value: '', // no value needed
    icon: <ListTodo className="h-4 w-4" />,
  },
  {
    name: 'Counterarguments',
    action: 'counterarguments',
    value: '', // no value needed
    icon: <Scale className="h-4 w-4" />,
  },
];

interface TextSelectionToolbarProps {
  menuData: { text: string; rect: DOMRect } | null;
  onAction: (tool: typeof tools[0]) => void;
}


export function TextSelectionToolbar({ menuData: menuData, onAction }: TextSelectionToolbarProps) {
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  React.useLayoutEffect(() => {
    if (menuData && toolbarRef.current) {
      const { rect } = menuData;
      const toolbarRect = toolbarRef.current.getBoundingClientRect();
      
      const top = window.scrollY + rect.bottom + 8;
      let left = window.scrollX + rect.left + rect.width / 2 - toolbarRect.width / 2;

      // Prevent going off-screen
      left = Math.max(8, Math.min(left, window.innerWidth - toolbarRect.width - 8));

      setPosition({ top, left });
    }
  }, [menuData]);
  
  const isOpen = !!menuData;

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
        onClick={(e) => e.stopPropagation()} // Prevents the main click handler from closing the menu
      >
        {tools.map((tool) => (
            <Tooltip key={tool.name} delayDuration={300}>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onAction(tool)}>
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
