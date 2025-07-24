
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  LogIn,
  LogOut,
  Plus,
  Settings,
  Sparkles,
  LayoutDashboard,
  PanelLeftClose,
  PanelRightClose,
  MessageSquare,
  User,
  Trash2,
  BrainCircuit,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { User as FirebaseUser } from 'firebase/auth';
import type { ChatHistoryItem } from '@/hooks/use-chat-history';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { useAuth } from '@/context/auth-context';
import { motion } from 'framer-motion';

interface ChatSidebarProps {
  user: FirebaseUser | null;
  chatHistory: ChatHistoryItem[];
  activeChatId: string | null;
  onNewChat: () => void;
  onChatSelect: (id: string) => void;
  onDeleteChat: (id: string) => void;
  isLoading: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
}

const SidebarSkeleton = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <div className="p-4 space-y-4">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className={cn(
          'h-8 bg-muted/50 rounded-md animate-pulse',
          isCollapsed ? 'w-10 h-10' : `w-full`
        )}
      />
    ))}
  </div>
);

const UserMenuItems = () => {
    const router = useRouter();
    const { toast } = useToast();
    const { user, isPremium, username } = useAuth();
  
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
          description: 'An error occurred while logging out. Please try again.',
        });
      }
    };
  
    if (!user) return null;
  
    const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  
    return (
      <>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        {username && (
          <DropdownMenuItem asChild>
            <Link href={`/student/${username}`}>
              <User className="mr-2 h-4 w-4" />
              My Public Profile
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/preferences">
            <Settings className="mr-2 h-4 w-4" />
            <span>Preferences</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {!isPremium && (
          <>
            <DropdownMenuItem asChild>
              <Link
                href="/premium"
                className="premium-gradient w-full flex items-center justify-center text-primary-foreground rounded-md py-1.5 focus:ring-0"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </DropdownMenuItem>
      </>
    );
};

const UserMenu = ({ user, isCollapsed }: { user: FirebaseUser | null, isCollapsed: boolean }) => {
  const authModal = useAuthModal();
  const { isPremium } = useAuth();
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  if (!user) {
    return (
      <Button variant="ghost" className={cn("w-full justify-start gap-3 text-sm h-auto py-2.5 px-2.5 hover:bg-muted/50", isCollapsed && "w-10 h-10 p-0 flex items-center justify-center")} onClick={() => authModal.onOpen('login')}>
        <Avatar className="h-10 w-10">
            <AvatarFallback><User /></AvatarFallback>
        </Avatar>
        <div className={cn("text-left", isCollapsed && "hidden")}>
            <p className="font-semibold">Guest</p>
            <p className="text-xs text-muted-foreground">Log in to save</p>
        </div>
      </Button>
    )
  }

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn("w-full justify-start gap-3 text-sm h-auto py-2.5 px-2.5 hover:bg-muted/50", isCollapsed && "w-10 h-10 p-0 flex items-center justify-center")}
          >
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={user?.photoURL || undefined}
                  data-ai-hint="person"
                />
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-secondary" />
            </div>
            <div
              className={cn('text-left transition-opacity duration-200', isCollapsed && "opacity-0 hidden")}
            >
              <p className="font-semibold truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {isPremium ? 'Premium Plan' : 'Free Plan'}
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[280px]" side="top" align="start">
          <UserMenuItems />
        </DropdownMenuContent>
      </DropdownMenu>
  );
};

const ChatSidebarComponent = ({
  user,
  chatHistory,
  activeChatId,
  onNewChat,
  onChatSelect,
  onDeleteChat,
  isLoading,
  isCollapsed,
  onToggle,
}: ChatSidebarProps) => {

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 320 }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className='flex-col bg-secondary/30 border-r border-border/50 flex'
      >
        <div
          className={cn(
            'flex items-center h-16 px-4 shrink-0',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <Link
            href="/"
            className={cn(
              'flex items-center gap-2 text-xl font-semibold text-foreground',
              isCollapsed && 'hidden'
            )}
          >
            <Logo className="h-7 w-7" />
            FocusFlow AI
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden md:inline-flex"
            onClick={onToggle}
          >
            {isCollapsed ? (
              <PanelRightClose className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-center px-4 mb-2">
          <Button
            variant="outline"
            className={cn(
              'w-full rounded-xl h-10',
              isCollapsed && 'w-10 h-10 p-0 flex items-center justify-center'
            )}
            onClick={onNewChat}
          >
            <Plus className="h-4 w-4" />
            <span className={cn('ml-2', isCollapsed && 'hidden')}>New Chat</span>
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="py-2 px-4 space-y-1">
            {isLoading && user ? (
              <SidebarSkeleton isCollapsed={isCollapsed} />
            ) : (
              <div className="space-y-1">
                {chatHistory.map((chat) => (
                  <Tooltip key={chat.id}>
                    <TooltipTrigger asChild>
                      <div
                        role="button"
                        className={cn(
                          'flex w-full items-center font-normal py-2 px-3 rounded-lg cursor-pointer text-foreground transition-all duration-200 transform group/item',
                          activeChatId === chat.id 
                            ? 'bg-muted ring-1 ring-primary/20' 
                            : 'hover:bg-muted/80 hover:scale-[1.02]',
                          isCollapsed ? 'justify-center items-center h-10 w-10 p-0 flex items-center justify-center' : 'justify-between gap-3'
                        )}
                        onClick={() => {
                          onChatSelect(chat.id);
                        }}
                      >
                        <div className={cn('flex items-center gap-3 flex-1 min-w-0', isCollapsed && 'justify-center')}>
                            <MessageSquare className="h-5 w-5 shrink-0" />
                            <div className={cn('flex-1 min-w-0', isCollapsed && 'hidden')}>
                                <p className="truncate font-medium text-sm">{chat.title}</p>
                                <p className="truncate text-xs text-muted-foreground">{chat.lastMessagePreview}</p>
                            </div>
                        </div>
                        {!isCollapsed && (
                          <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 opacity-0 group-hover/item:opacity-100"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteChat(chat.id);
                              }}
                          >
                              <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" align="center">
                        <p className="font-medium">{chat.title}</p>
                        <p className="text-sm text-muted-foreground">{chat.lastMessagePreview}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="py-2 mt-auto px-4 border-t">
            <div className={cn(isCollapsed ? 'opacity-0 hidden' : 'opacity-100 transition-opacity duration-200')}>
                 <UserMenu user={user} isCollapsed={false} />
            </div>
            {isCollapsed && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-center text-sm h-auto p-0 hover:bg-transparent">
                            <div className="relative">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user?.photoURL || undefined} data-ai-hint="person" />
                                    <AvatarFallback>{user ? (user.displayName || 'U').charAt(0).toUpperCase() : <User />}</AvatarFallback>
                                </Avatar>
                                {user && <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-secondary" />}
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 mb-2" side="top" align="start">
                        {user ? <UserMenuItems /> : (
                            <DropdownMenuItem onClick={() => useAuthModal.getState().onOpen('login')}>
                                <LogIn className="mr-2 h-4 w-4" />
                                Log In
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

export const ChatSidebar = React.memo(ChatSidebarComponent);
