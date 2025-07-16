
'use client';

import { Menu, Notebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotesStore } from '@/stores/use-notes-store';

interface ChatHeaderProps {
  personaName: string;
  onSidebarToggle: () => void;
  isLoggedIn: boolean;
}

export function ChatHeader({
  personaName,
  onSidebarToggle,
  isLoggedIn,
}: ChatHeaderProps) {
  const { toggleNotes } = useNotesStore();

  return (
    <header className="sticky top-0 z-10 h-16 px-6 flex justify-between items-center w-full border-b border-border/60 bg-background/95 backdrop-blur-sm">
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
          <p className="text-sm text-muted-foreground -mt-1">
            with {personaName}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isLoggedIn && (
          <Button variant="ghost" size="icon" onClick={toggleNotes}>
            <Notebook className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
}


