
'use client';

import React from 'react';
import { Menu, Notebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatHeaderProps {
  personaName: string;
  personaDescription?: string;
  personaAvatar?: string | null;
  onSidebarToggle: () => void;
  isLoggedIn: boolean;
  onNotesToggle: () => void;
}

const ChatHeaderComponent = ({
  personaName,
  personaDescription,
  personaAvatar,
  onSidebarToggle,
  isLoggedIn,
  onNotesToggle,
}: ChatHeaderProps) => {

  return (
    <header className="sticky top-0 z-10 h-16 px-4 md:px-6 flex justify-between items-center w-full border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onSidebarToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Chat</h2>
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="text-sm text-muted-foreground -mt-1 flex items-center gap-1.5">
                  with
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={personaName}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="font-medium text-foreground flex items-center gap-2"
                    >
                      {personaAvatar && (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted/30 text-sm">
                          {personaAvatar}
                        </span>
                      )}
                      <span>{personaName}</span>
                    </motion.span>
                  </AnimatePresence>
                </div>
              </TooltipTrigger>
              {personaDescription && (
                <TooltipContent side="bottom" align="start" className="max-w-xs">
                  <p className="font-semibold mb-1">{personaName}</p>
                  <p className="text-sm text-muted-foreground">{personaDescription}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isLoggedIn && (
          <Button variant="ghost" size="icon" onClick={onNotesToggle}>
            <Notebook className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
}

export const ChatHeader = React.memo(ChatHeaderComponent);
