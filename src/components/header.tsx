
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Logo } from './logo';
import { useAuth } from '@/context/auth-context';
import { ArrowRight, MessageSquare, Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthModal } from '@/hooks/use-auth-modal';

const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/my-content', label: 'My Content' },
    { href: '/premium', label: 'Premium' },
];

export const Header = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const authModal = useAuthModal();

  // Do not render the header on the main chat page or any of its sub-routes
  if (pathname.startsWith('/chat')) {
    return null;
  }
  
  const handleOpenAuthModal = (view: 'login' | 'signup') => {
    authModal.setView(view);
    authModal.onOpen();
  }

  const desktopNav = (
    <nav className="hidden md:flex items-center gap-6">
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
            <Link
              key={link.href + link.label}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
        );
    })}
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
            {navLinks.map((link) => {
               const isActive = pathname === link.href;
               return (
                  <SheetClose asChild key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className={cn(
                          "text-lg font-medium transition-colors",
                           isActive
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
               );
            })}
          </nav>
          <div className="flex flex-col gap-2 mt-auto">
            {user ? (
              <Button asChild>
                <Link href="/chat">
                    <MessageSquare className="mr-2 h-4 w-4" /> Go to Chat
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => handleOpenAuthModal('login')}>
                  Login
                </Button>
                <Button onClick={() => handleOpenAuthModal('signup')}>
                  Get Started
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
        {user && desktopNav}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Button asChild>
                <Link href="/chat">
                  <MessageSquare className="mr-2 h-4 w-4" /> Go to Chat
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => handleOpenAuthModal('login')}>
                  Login
                </Button>
                <Button onClick={() => handleOpenAuthModal('signup')}>
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
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
