
'use client';

import Link from 'next/link';
import { Menu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  personaName: string;
  onSidebarToggle: () => void;
  isLoggedIn: boolean;
}

export function ChatHeader({ personaName, onSidebarToggle, isLoggedIn }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-10 h-16 px-6 flex justify-between items-center w-full border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onSidebarToggle}>
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold text-foreground">Chat</h2>
        <p className="text-sm text-muted-foreground">with {personaName}</p>
      </div>
      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <Button asChild size="sm" className="premium-gradient hover:opacity-90">
            <Link href="/premium">
              <Sparkles className="h-4 w-4 mr-2" />
              Go Premium
            </Link>
          </Button>
        ) : (
          <>
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="bg-primary text-primary-foreground">
              <Link href="/login">Sign Up</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
