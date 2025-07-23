
'use client';

import { Menu, Notebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useContextHubStore } from '@/stores/use-context-hub-store';

interface ChatHeaderProps {
  personaName: string;
  onSidebarToggle: () => void;
  isLoggedIn: boolean;
  onNotesToggle: () => void;
}

export function ChatHeader({
  personaName,
  onSidebarToggle,
  isLoggedIn,
  onNotesToggle,
}: ChatHeaderProps) {

  return (
    <header className="sticky top-0 z-10 h-16 px-4 md:px-6 flex justify-between items-center w-full border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => {
            console.log("Sidebar toggle clicked");
            onSidebarToggle();
          }}
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
          <Button variant="ghost" size="icon" onClick={() => {
            console.log("Notes toggle clicked");
            onNotesToggle();
          }}>
            <Notebook className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
}
