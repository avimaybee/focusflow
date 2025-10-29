
'use client';

import React from 'react';
import { Menu, Notebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

  const renderPersonaAvatar = () => {
    if (!personaAvatar) {
      return <AvatarFallback>{personaName.charAt(0)}</AvatarFallback>;
    }

    const isImage = personaAvatar.startsWith('http') || personaAvatar.startsWith('data:');

    if (isImage) {
      return (
        <>
          <AvatarImage src={personaAvatar} alt={personaName} />
          <AvatarFallback>{personaName.charAt(0)}</AvatarFallback>
        </>
      );
    }

    return <AvatarFallback>{personaAvatar}</AvatarFallback>;
  };

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
                <div className="text-sm text-muted-foreground -mt-1 flex items-center gap-2 rounded-full border border-border/50 bg-secondary/60 px-2 py-1">
                  <span className="text-xs uppercase tracking-wide">With</span>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={personaName}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2"
                    >
                      <Avatar className="h-6 w-6">
                        {renderPersonaAvatar()}
                      </Avatar>
                      <span className="font-medium text-foreground text-sm">{personaName}</span>
                    </motion.div>
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
