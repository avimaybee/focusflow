
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Logo } from './logo';
import { useAuth } from '@/context/auth-context';
import { ArrowRight, MessageSquare, Menu, LogOut, LayoutDashboard, Library } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/my-content', label: 'My Content', icon: Library },
    { href: '/premium', label: 'Premium', icon: null },
];

export const Header = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const authModal = useAuthModal();
  const { toast } = useToast();

  if (pathname.startsWith('/chat')) {
    return null;
  }
  
  const handleOpenAuthModal = (view: 'login' | 'signup', layoutId: string) => {
    authModal.onOpen(view, layoutId);
  }

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

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  const desktopNav = (
    <nav className="hidden md:flex items-center gap-6">
      {navLinks.map((link) => {
        if (!link.icon) return null;
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
               <>
                <Button asChild>
                    <Link href="/chat">
                        <MessageSquare className="mr-2 h-4 w-4" /> Go to Chat
                    </Link>
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
               </>
            ) : (
              <>
                <motion.div layoutId="mobile-login-trigger">
                  <Button variant="outline" className="w-full" onClick={() => handleOpenAuthModal('login', 'mobile-login-trigger')}>
                    Login
                  </Button>
                </motion.div>
                <Button asChild className="w-full">
                    <Link href="/chat">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  const loggedInButtons = (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" className="hidden sm:inline-flex">
        <Link href="/chat">
            <MessageSquare className="mr-2 h-4 w-4" /> Go to Chat
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL || undefined} alt={displayName} />
                    <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/my-content"><Library className="mr-2 h-4 w-4" />My Content</Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  const loggedOutButtons = (
     <div className="hidden md:flex items-center gap-2">
        <motion.div layoutId="auth-modal-trigger-login">
          <Button variant="ghost" onClick={() => handleOpenAuthModal('login', 'auth-modal-trigger-login')}>
              Login
          </Button>
        </motion.div>
        <Button asChild>
            <Link href="/chat">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
     </div>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="font-bold text-lg hidden sm:inline-block">FocusFlow AI</span>
        </Link>
        {user && desktopNav}
        <div className="flex items-center gap-2">
            <div className="hidden md:flex">
                {user ? loggedInButtons : loggedOutButtons}
            </div>
          {mobileNav}
        </div>
      </div>
    </header>
  );
};
