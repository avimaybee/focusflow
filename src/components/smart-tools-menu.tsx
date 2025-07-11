
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, Presentation, ListTodo, Scale, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export const smartTools = [
  {
    name: 'Rewrite for Clarity',
    action: 'rewrite',
    value: 'clearer and more concise',
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    name: 'Make it Bullets',
    action: 'bulletPoints',
    value: '',
    icon: <ListTodo className="h-4 w-4" />,
  },
  {
    name: 'Find Counterarguments',
    action: 'counterarguments',
    value: '',
    icon: <Scale className="h-4 w-4" />,
  },
  {
    name: 'Create Presentation',
    action: 'presentation',
    value: '',
    icon: <Presentation className="h-4 w-4" />,
  },
  {
    name: 'Highlight Insights',
    action: 'insights',
    value: '',
    icon: <Sparkles className="h-4 w-4" />,
  },
];

interface SmartToolsMenuProps {
  onAction: (tool: typeof smartTools[0]) => void;
}

export function SmartToolsMenu({ onAction }: SmartToolsMenuProps) {
  return (
    <TooltipProvider>
      <div
        role="toolbar"
        aria-label="Smart Tools"
        className="flex items-center gap-1 rounded-full bg-card p-1 shadow-lg border"
        onClick={(e) => e.stopPropagation()}
      >
        {smartTools.map((tool) => (
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
