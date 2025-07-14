
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CaseUpper,
  ListTodo,
  Scale,
  BookText,
  Presentation,
} from 'lucide-react';

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
    prompt: (text) => `Create a 5-slide presentation outline for the topic: "${text}"`,
    icon: <Presentation className="h-4 w-4" />,
  },
];

interface SmartToolsMenuProps {
  onAction: (tool: SmartTool) => void;
}

export function SmartToolsMenu({ onAction }: SmartToolsMenuProps) {
  return (
    <TooltipProvider>
      <div
        role="toolbar"
        aria-label="Smart Tools"
        className="flex items-center gap-1 rounded-full bg-card p-1 shadow-sm border"
        onClick={(e) => e.stopPropagation()}
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
      </div>
    </TooltipProvider>
  );
}
