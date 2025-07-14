
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  LogOut,
  Plus,
  Settings,
  Sparkles,
  LayoutDashboard,
  PanelLeftClose,
  PanelRightClose,
  MessageSquare,
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

interface ChatSidebarProps {
  user: FirebaseUser | null;
  chatHistory: ChatHistoryItem[];
  activeChatId: string | null;
  onNewChat: () => void;
  onChatSelect: (id: string) => void;
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
          isCollapsed ? 'w-8' : `w-${[48, 32, 40, 36, 24][i]}`
        )}
      />
    ))}
  </div>
);

export function ChatSidebar({
  user,
  chatHistory,
  activeChatId,
  onNewChat,
  onChatSelect,
  isLoading,
  isCollapsed,
  onToggle,
}: ChatSidebarProps) {
  const router = useRouter();
  const { toast } = useToast();
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

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex-col bg-secondary/30 border-r border-border/60 hidden md:flex group/sidebar transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-20' : 'w-80'
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

        <div className="flex items-center justify-center mb-4">
          <Button
            variant="outline"
            className={cn(
              'w-full mx-4',
              isCollapsed && 'w-auto h-10 px-2'
            )}
            onClick={onNewChat}
          >
            <Plus className="h-4 w-4" />
            <span className={cn('ml-2', isCollapsed && 'hidden')}>New Chat</span>
          </Button>
        </div>

        <ScrollArea className="flex-1 -mx-4">
          {isLoading ? (
            <SidebarSkeleton isCollapsed={isCollapsed} />
          ) : (
            <div className="px-4 py-2 space-y-1">
              {chatHistory.map((chat) => (
                <Tooltip key={chat.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeChatId === chat.id ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3 font-normal py-3 px-4 hover:bg-muted/50 text-foreground',
                        isCollapsed && 'justify-center px-2'
                      )}
                      onClick={() => onChatSelect(chat.id)}
                    >
                      <MessageSquare className="h-5 w-5 shrink-0" />
                      <span className={cn('truncate', isCollapsed && 'hidden')}>
                        {chat.title}
                      </span>
                    </Button>
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
        </ScrollArea>

        <div className="py-2 mt-auto px-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-sm h-auto py-2 px-2 hover:bg-muted/50"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.photoURL || undefined}
                    data-ai-hint="person"
                  />
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    'text-left transition-opacity duration-200',
                    isCollapsed && 'opacity-0 hidden'
                  )}
                >
                  <p className="font-semibold truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground">Free Plan</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" side="top" align="start">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
}
