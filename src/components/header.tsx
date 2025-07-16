
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Logo } from './logo';
import { useAuth } from '@/context/auth-context';
import { MessageSquare, Menu, X, LayoutDashboard, Library, Newspaper, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useState } from 'react';

const appNavLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/my-content', label: 'My Content' },
  { href: '/blog', label: 'Blog' },
];

const landingNavLinks = [
  { href: '/#features', label: 'Features' },
  { href: '/#testimonials', label: 'Testimonials' },
  { href: '/#faq', label: 'FAQ' },
];

export const Header = () => {
  const { user, isPremium } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const authModal = useAuthModal();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (pathname.startsWith('/chat')) {
    return null;
  }

  const handleOpenAuthModal = (view: 'login' | 'signup', layoutId: string) => {
    authModal.onOpen(view, layoutId);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An error occurred. Please try again.',
      });
    }
  };
  
  const isLandingPage = pathname === '/';
  const navLinks = isLandingPage ? landingNavLinks : appNavLinks;

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  const navContent = (
    <>
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href + link.label}
            href={link.href}
            className={cn(
              'nav-link',
              isActive && 'nav-link-active'
            )}
          >
            {link.label}
          </Link>
        );
      })}
       {!isLandingPage && user && !isPremium && (
          <Link href="/premium" className={cn('nav-link', pathname === '/premium' && 'nav-link-active')}>
              Premium
          </Link>
      )}
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
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navContent}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
               <Button asChild variant="ghost" size="sm" className="hidden sm:flex items-center gap-1.5">
                  <Link href="/chat">
                      <MessageSquare className="h-4 w-4" /> Go to Chat
                  </Link>
                </Button>
               <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-medium border border-border">
                  <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.photoURL || undefined} alt={displayName} />
                      <AvatarFallback>{initial}</AvatarFallback>
                  </Avatar>
               </div>
            </>
          ) : (
             <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleOpenAuthModal('login', 'desktop-login')}>Sign In</Button>
                <Button size="sm" onClick={() => handleOpenAuthModal('signup', 'desktop-signup')}>Get Started</Button>
             </div>
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
              {navContent}
            </nav>
            <div className="pt-4 border-t border-border/60">
              {user ? (
                 <Button asChild className="w-full">
                    <Link href="/chat">Go to Chat</Link>
                 </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => handleOpenAuthModal('login', 'mobile-login')}>Sign In</Button>
                  <Button size="sm" className="w-full" onClick={() => handleOpenAuthModal('signup', 'mobile-signup')}>Get Started</Button>
                </div>
              )}
            </div>
          </motion.div>
      )}
    </motion.header>
  );
};
