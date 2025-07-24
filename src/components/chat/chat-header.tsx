
'use client';

import React from 'react';
import { Menu, Notebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';

interface ChatHeaderProps {
  personaName: string;
  onSidebarToggle: () => void;
  isLoggedIn: boolean;
  onNotesToggle: () => void;
}

const ChatHeaderComponent = ({
  personaName,
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
          <div className="text-sm text-muted-foreground -mt-1 flex items-center gap-1.5">
            with
            <AnimatePresence mode="wait">
              <motion.span
                key={personaName}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="font-medium text-foreground"
              >
                {personaName}
              </motion.span>
            </AnimatePresence>
          </div>
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
