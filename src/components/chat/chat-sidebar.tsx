
'use client';

import { useState } from 'react';
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
          isCollapsed ? 'w-10 h-10' : `w-${[48, 32, 40, 36, 24][i]} w-full`
        )}
      />
    ))}
  </div>
);

import { useAuth } from '@/context/auth-context';

// ... (imports)

const UserMenu = ({ user }: { user: FirebaseUser | null }) => {
  const router = useRouter();
  const { toast } = useToast();
  const authModal = useAuthModal();
  const { isPremium, username } = useAuth(); // Use the auth context
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

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

  if (!user) {
    return (
      <Button variant="ghost" className="w-full justify-start gap-3 text-sm h-auto py-2.5 px-2.5 hover:bg-muted/50" onClick={() => authModal.onOpen('login')}>
        <Avatar className="h-8 w-8">
            <AvatarFallback><User /></AvatarFallback>
        </Avatar>
        <div className="text-left">
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
            className="w-full justify-start gap-3 text-sm h-auto py-2.5 px-2.5 hover:bg-muted/50"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user?.photoURL || undefined}
                data-ai-hint="person"
              />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div
              className={'text-left transition-opacity duration-200'}
            >
              <p className="font-semibold truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {isPremium ? 'Premium Plan' : 'Free Plan'}
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[280px]" side="top" align="start">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
        </DropdownMenuContent>
      </DropdownMenu>
  );
};

export function ChatSidebar({
  user,
  chatHistory,
  activeChatId,
  onNewChat,
  onChatSelect,
  onDeleteChat,
  isLoading,
  isCollapsed,
  onToggle,
}: ChatSidebarProps) {

  const renderUserMenu = (isInDropdown: boolean) => (
    <div className={cn(isInDropdown ? 'opacity-0 hidden' : '', isCollapsed && (isInDropdown ? '' : 'opacity-0 hidden'))}>
        <UserMenu user={user} />
    </div>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex-col bg-secondary/30 border-r border-border/50 hidden md:flex group/sidebar transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-20 min-w-[80px]' : 'w-80'
        )}
      >
        <div
          className={cn(
            'flex items-center mb-4 mt-2 h-12 px-4',
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
            className="h-8 w-8"
            onClick={onToggle}
          >
            {isCollapsed ? (
              <PanelRightClose className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-center mb-4 gap-2 mx-4">
          <Button
            variant="ghost"
            className={cn(
              'w-full border border-dashed rounded-xl',
              isCollapsed && 'w-auto h-10 px-2.5'
            )}
            onClick={onNewChat}
          >
            <Plus className="h-4 w-4" />
            <span className={cn('ml-2', isCollapsed && 'hidden')}>New Chat</span>
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-2">
              <div className="py-2 space-y-1">
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
                              'flex items-center w-full justify-between gap-3 font-normal py-3 px-2 rounded-xl cursor-pointer hover:bg-muted/50 text-foreground',
                              'group/item', // Add a group name for the item
                              activeChatId === chat.id && 'bg-secondary',
                              isCollapsed && 'justify-center'
                            )}
                            onClick={() => {
                              onChatSelect(chat.id);
                            }}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <MessageSquare className="h-5 w-5 shrink-0" />
                                <span className={cn('flex-1 truncate', isCollapsed && 'hidden')}>
                                  {chat.title}
                                </span>
                            </div>
                            {!isCollapsed && (
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0 opacity-0 group-hover/item:opacity-100" // Use group-hover
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
                            <p>{chat.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
        </div>

        <div className="py-2 mt-auto px-4">
            <div className={cn(isCollapsed ? 'opacity-0 hidden' : '')}>
                 <UserMenu user={user} />
            </div>
            {isCollapsed && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-center gap-3 text-sm h-auto py-2 px-2 hover:bg-muted/50">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.photoURL || undefined} data-ai-hint="person" />
                                <AvatarFallback>{user ? (user.displayName || 'U').charAt(0).toUpperCase() : <User />}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64" side="top" align="start">
                        <UserMenu user={user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
