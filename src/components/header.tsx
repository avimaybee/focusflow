
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Logo } from './logo';
import { useAuth } from '@/context/auth-context';
import { MessageSquare, Menu, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { UserNav } from './auth/user-nav';
import { motion } from 'framer-motion';
import { useState } from 'react';

export const Header = () => {
  const { user, isPremium, isGuest } = useAuth();
  const pathname = usePathname();
  const authModal = useAuthModal();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (pathname.startsWith('/chat')) {
    return null;
  }

  const handleOpenAuthModal = (view: 'login' | 'signup', layoutId: string) => {
    authModal.onOpen(view, layoutId);
  };

  const baseNavLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/my-content', label: 'My Content' },
    { href: '/blog', label: 'Blog' },
  ];

  const navLinks = user && !isGuest && !isPremium 
    ? [...baseNavLinks, { href: '/premium', label: 'Premium' }]
    : baseNavLinks;

  const navContent = (
    <>
      {navLinks.map((link) => {
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href + link.label}
            href={link.href}
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              'nav-link',
              isActive && 'nav-link-active'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-sm"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left Side */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="font-bold text-lg hidden sm:inline-block">FocusFlow AI</span>
          </Link>
        </div>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navContent}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {user && !isGuest ? (
            <>
               <Button asChild variant="ghost" size="sm" className="hidden sm:flex items-center gap-1.5">
                  <Link href="/chat">
                      <MessageSquare className="h-4 w-4" /> Go to Chat
                  </Link>
                </Button>
               <UserNav />
            </>
          ) : (
             <motion.div layoutId="auth-modal-trigger" className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleOpenAuthModal('login', 'auth-modal-trigger')}>Log In</Button>
                <Button size="sm" onClick={() => handleOpenAuthModal('signup', 'auth-modal-trigger')}>Sign Up</Button>
             </motion.div>
          )}
           <button
            className="md:hidden text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
       {/* Mobile Menu */}
       {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full inset-x-0 bg-background/95 border-t border-border/80 p-4 space-y-4 md:hidden"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.filter(link => link.href).map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'nav-link',
                      isActive && 'nav-link-active'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-border/60">
              {user && !isGuest ? (
                 <Button asChild className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    <Link href="/chat">Go to Chat</Link>
                 </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => { handleOpenAuthModal('login', 'auth-modal-trigger-mobile'); setIsMobileMenuOpen(false); }}>Log In</Button>
                  <Button size="sm" className="w-full" onClick={() => { handleOpenAuthModal('signup', 'auth-modal-trigger-mobile'); setIsMobileMenuOpen(false); }}>Sign Up</Button>
                </div>
              )}
            </div>
          </motion.div>
      )}
    </motion.header>
  );
};
