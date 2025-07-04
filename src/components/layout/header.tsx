"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '../logo';

const navLinks = [
  { href: '/summarizer', label: 'Summarizer' },
  { href: '/planner', label: 'Planner' },
  { href: '/tracker', label: 'Tracker' },
  { href: '/flashcards', label: 'Flashcards' },
  { href: '/quiz', label: 'Quiz' },
  { href: '/blog', label: 'Blog' },
];

export default function Header() {
  const pathname = usePathname();

  const NavLinks = ({ className }: { className?: string }) => (
    <nav className={cn('flex items-center gap-6 text-sm', className)}>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'font-medium transition-colors hover:text-primary',
            pathname === link.href ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span className="font-bold font-headline">FocusFlow AI</span>
          </Link>
        </div>

        <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
          <NavLinks className="ml-6" />

          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/premium">
                <Sparkles className="mr-2 h-4 w-4" /> Go Premium
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-8 py-8">
                <Link href="/" className="flex items-center gap-2">
                    <Logo className="h-6 w-6" />
                    <span className="font-bold font-headline">FocusFlow AI</span>
                </Link>
                <nav className="grid gap-6 text-lg font-medium">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'transition-colors hover:text-primary',
                        pathname === link.href
                          ? 'text-primary'
                          : 'text-foreground'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="grid gap-4">
                    <Button asChild><Link href="/login">Login</Link></Button>
                    <Button asChild variant="outline"><Link href="/premium">Go Premium</Link></Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
