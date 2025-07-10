
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Logo } from './logo';
import { useAuth } from '@/context/auth-context';
import { ArrowRight, Menu, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const navLinks = [
    { href: '#features', label: 'Summarizer' },
    { href: '#features', label: 'Flashcards' },
    { href: '#features', label: 'Notes' },
    { href: '#features', label: 'Tools' },
    { href: '#features', label: 'Help' },
];

export const Header = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const pathname = usePathname();

  const isChatPage = pathname === '/chat';

  if (isChatPage && isMobile) {
    return null;
  }

  const desktopNav = (
    <nav className="hidden md:flex items-center gap-6">
      {navLinks.map((link) => (
        <Link
          key={link.href + link.label}
          href={link.href}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );

  const mobileNav = (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <div className="flex flex-col gap-6 p-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-bold text-lg">FocusFlow AI</span>
          </Link>
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <SheetClose asChild key={link.href + link.label}>
                <Link
                  href={link.href}
                  className="text-lg font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </SheetClose>
            ))}
          </nav>
          <div className="flex flex-col gap-2 mt-auto">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/login">Go Premium</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="font-bold text-lg hidden sm:inline-block">FocusFlow AI</span>
        </Link>
        {desktopNav}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/login">
                    Go Premium <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>
          {mobileNav}
        </div>
      </div>
    </header>
  );
};
