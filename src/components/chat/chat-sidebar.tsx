'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LogIn,
  LogOut,
  MessageSquarePlus,
  Settings,
  Sparkles,
  LayoutDashboard,
  PanelLeftClose,
  PanelRightClose,
  User,
  Trash2,
  EllipsisVertical,
  Check,
  X,
  Loader2,
  Search,
  Pencil,
  Bookmark,
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
import type { ChatHistoryItem } from '@/hooks/use-chat-history';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { useAuth } from '@/context/auth-context';
import { motion } from 'framer-motion';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { formatDistanceToNow, differenceInCalendarDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { authenticatedFetch } from '@/lib/auth-helpers';

type ChatGroupKey = 'today' | 'yesterday' | 'thisWeek' | 'older';

const chatGroupLabels: Record<ChatGroupKey, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'Earlier This Week',
  older: 'Older',
};

const groupChatHistory = (history: ChatHistoryItem[]): Array<{ key: ChatGroupKey; label: string; items: ChatHistoryItem[] }> => {
  if (!history || history.length === 0) {
    return [];
  }

  const buckets: Record<ChatGroupKey, ChatHistoryItem[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  const now = new Date();

  [...history]
    .sort((a, b) => {
      const aTime = a.createdAt ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    })
    .forEach((item) => {
      const createdAt = item.createdAt;
      if (!createdAt) {
        buckets.older.push(item);
        return;
      }

      const diff = differenceInCalendarDays(now, createdAt);
      if (diff === 0) {
        buckets.today.push(item);
      } else if (diff === 1) {
        buckets.yesterday.push(item);
      } else if (diff < 7) {
        buckets.thisWeek.push(item);
      } else {
        buckets.older.push(item);
      }
    });

  return (Object.keys(buckets) as ChatGroupKey[])
    .map((key) => ({ key, label: chatGroupLabels[key], items: buckets[key] }))
    .filter((group) => group.items.length > 0);
};

const chatAvatarPalettes = [
  'bg-muted text-foreground/80',
  'bg-muted text-foreground/80',
  'bg-muted text-foreground/80',
  'bg-muted text-foreground/80',
];

const computePaletteIndex = (title: string) => {
  const safeTitle = title || 'Chat';
  let hash = 0;
  for (let i = 0; i < safeTitle.length; i += 1) {
    hash = (hash << 5) - hash + safeTitle.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash) % chatAvatarPalettes.length;
};

const getChatAvatarClasses = (title: string) => chatAvatarPalettes[computePaletteIndex(title)];

const getChatInitials = (title: string) => {
  const safeTitle = title?.trim() || 'Chat';
  const words = safeTitle.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'C';
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

interface ChatSidebarProps {
  user: SupabaseUser | null;
  chatHistory: ChatHistoryItem[];
  activeChatId: string | null;
  onNewChat: () => void;
  onChatSelect: (id: string) => void;
  onDeleteChat: (id: string) => void;
  isLoading: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  onRefreshHistory: () => Promise<void> | void;
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
    const { user, isPremium, username, profile } = useAuth();
  
    const handleLogout = async () => {
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
        });
        
        if (response.ok) {
          toast({
            title: 'Logged Out',
            description: 'You have been successfully logged out.',
          });
          router.push('/');
          // Force reload to clear all state
          window.location.href = '/';
        } else {
          throw new Error('Logout failed');
        }
      } catch (error) {
        console.error('Error logging out:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to log out. Please try again.',
        });
      }
    };
  
    if (!user) return null;
  
    const displayName = profile?.username || user.email?.split('@')[0] || 'User';
  
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
                className="w-full flex items-center justify-center rounded-md bg-primary py-1.5 text-primary-foreground transition hover:bg-primary/90 focus:ring-0"
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

const UserMenu = ({ user, isCollapsed }: { user: SupabaseUser | null, isCollapsed: boolean }) => {
  const authModal = useAuthModal();
  const { isPremium, profile } = useAuth();
  const displayName = profile?.username || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  if (!user) {
    const content = (
      <>
        <Avatar className="h-10 w-10">
          <AvatarFallback><User /></AvatarFallback>
        </Avatar>
        <div className={cn("text-left", isCollapsed && "hidden")}>
          <p className="font-semibold">Guest</p>
          <p className="text-xs text-muted-foreground">Log in to save</p>
        </div>
      </>
    );

    const buttonClasses = cn(
      "w-full justify-start gap-3 text-sm h-auto py-2.5 px-2.5 hover:bg-muted/50",
      isCollapsed && "w-12 h-12 p-0 flex items-center justify-center rounded-full"
    );

    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className={buttonClasses} onClick={() => authModal.onOpen('login')}>
                {content}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" align="center">
              Log In
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Button variant="ghost" className={buttonClasses} onClick={() => authModal.onOpen('login')}>
        {content}
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-sm h-auto py-2.5 px-2.5 hover:bg-muted/50",
                  isCollapsed && "w-12 h-12 p-0 flex items-center justify-center rounded-full"
                )}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user?.user_metadata?.avatar_url || undefined}
                      data-ai-hint="person"
                    />
                    <AvatarFallback>{initial}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-state-success ring-2 ring-surface-soft" />
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
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right" align="center">
              {displayName}
            </TooltipContent>
          )}
        </Tooltip>
        <DropdownMenuContent className="w-[280px]" side="top" align="start">
          <UserMenuItems />
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
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
  onRefreshHistory,
}: ChatSidebarProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [editingChatId, setEditingChatId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState('');
  const [isRenaming, setIsRenaming] = React.useState(false);
  const renameInputRef = React.useRef<HTMLInputElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    if (editingChatId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [editingChatId]);

  const handleStartRename = React.useCallback((chat: ChatHistoryItem) => {
    setEditingChatId(chat.id);
    setRenameValue(chat.title || '');
  }, []);

  const handleCancelRename = React.useCallback(() => {
    if (isRenaming) return;
    setEditingChatId(null);
    setRenameValue('');
  }, [isRenaming]);

  const handleRenameSubmit = React.useCallback(async (chatId: string) => {
    const nextTitle = renameValue.trim();
    if (!nextTitle) {
      toast({
        title: 'Title required',
        description: 'Please enter a name for your chat before saving.',
        variant: 'destructive',
      });
      return;
    }

    if (isRenaming) return;

    setIsRenaming(true);
    try {
      const response = await authenticatedFetch('/api/chat/rename', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId, title: nextTitle }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'Unable to rename chat.');
      }

      await Promise.resolve(onRefreshHistory());

      toast({
        title: 'Chat renamed',
        description: 'Your chat title was updated successfully.',
      });

      setEditingChatId(null);
      setRenameValue('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurred.';
      toast({
        title: 'Rename failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsRenaming(false);
    }
  }, [isRenaming, onRefreshHistory, renameValue, toast]);

  const filteredChatHistory = React.useMemo(() => {
    if (!chatHistory) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return chatHistory;
    return chatHistory.filter((item) => {
      const title = item.title || '';
      return title.toLowerCase().includes(term);
    });
  }, [chatHistory, searchTerm]);

  const groupedChatHistory = React.useMemo(() => groupChatHistory(filteredChatHistory || []), [filteredChatHistory]);

  React.useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.shiftKey) return;
      if (event.key.toLowerCase() !== 'k') return;

      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      event.preventDefault();
      if (isCollapsed) {
        onToggle();
        setTimeout(() => searchInputRef.current?.focus(), 120);
      } else {
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [isCollapsed, onToggle]);

  return (
    <TooltipProvider>
    <motion.aside
      style={{ width: isCollapsed ? 80 : 320 }}
      className='flex-col bg-background/95 border-r border-border/60 backdrop-blur-sm flex transition-all duration-300 ease-in-out'
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
              'flex items-center gap-2 text-xl font-semibold text-foreground/85',
              isCollapsed && 'hidden'
            )}
          >
            <Logo className="h-7 w-7" />
            FocusFlow AI
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex h-9 w-9"
            onClick={onToggle}
          >
            {isCollapsed ? (
              <PanelRightClose className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Quick Actions Section */}
        <div className={cn("px-3 mb-4", isCollapsed && "px-2 flex justify-center")}>
          <Button
            className={cn(
              'w-full h-10 rounded-xl bg-primary/10 hover:bg-primary/15 text-foreground/80 transition-colors font-medium',
              isCollapsed && 'h-10 w-10 rounded-lg p-0 flex items-center justify-center'
            )}
            onClick={onNewChat}
          >
            <MessageSquarePlus className={cn(isCollapsed ? 'h-5 w-5' : 'h-4 w-4')} />
            <span className={cn('ml-2.5', isCollapsed && 'hidden')}>New Chat</span>
          </Button>
        </div>

        {/* Navigation Menu */}
        {!isCollapsed && (
          <nav className="px-3 mb-4 space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-9 text-foreground/85 hover:bg-muted/60 rounded-lg"
              asChild
            >
              <Link href="/my-content">
                <Bookmark className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Saved</span>
              </Link>
            </Button>
          </nav>
        )}

        {/* Divider */}
        {!isCollapsed && (
          <div className="px-3 mb-3">
            <div className="h-px bg-border" />
          </div>
        )}

        {/* Chat History Section */}
        {!isCollapsed && (
          <div className="px-3 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground/75" />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1.5 h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  onClick={() => {
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Clear chat search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search..."
                className="h-9 rounded-xl border-0 bg-muted/20 pl-10 pr-10 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-border focus-visible:bg-muted/30"
                aria-label="Search chat history"
              />
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="px-2 mb-3">
            <div className="h-px bg-border" />
          </div>
        )}

        {!isCollapsed && chatHistory && chatHistory.length > 0 && (
          <div className="px-4 mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recents</p>
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className={cn('py-2 space-y-1', isCollapsed ? 'px-2' : 'px-4')}>
            {isLoading && user ? (
              <SidebarSkeleton isCollapsed={isCollapsed} />
            ) : (
              <div className="space-y-1">
                {groupedChatHistory.length === 0 && (chatHistory || []).length === 0 && (
                  <p className="text-sm text-muted-foreground px-2 py-4 text-center">
                    Start a conversation to see it appear here.
                  </p>
                )}
                {groupedChatHistory.length === 0 && (chatHistory || []).length > 0 && searchTerm.trim().length > 0 && (
                  <p className="text-sm text-muted-foreground px-2 py-4 text-center">
                    No chats match “{searchTerm}”.
                  </p>
                )}
                {groupedChatHistory.map((group, groupIndex) => (
                  <div key={group.key} className="space-y-1">
                    {isCollapsed ? (
                      groupIndex > 0 && <div className="mx-auto my-2 h-px w-6 bg-border" />
                    ) : (
                      <p className="px-2 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {group.label}
                      </p>
                    )}
                    {group.items.map((chat) => {
                  const relativeTime = chat.createdAt
                    ? formatDistanceToNow(chat.createdAt, { addSuffix: true })
                    : '';
                  const isActive = activeChatId === chat.id;
                  const isEditing = editingChatId === chat.id;

                  return (
                    <Tooltip key={chat.id}>
                      <TooltipTrigger asChild>
                        <div
                          role="button"
                          aria-current={isActive ? 'true' : undefined}
                          className={cn(
                            'flex items-center font-normal cursor-pointer text-foreground/85 transition-all duration-200 group/item',
                            isCollapsed
                              ? 'mx-auto h-12 w-12 justify-center rounded-full p-0'
                              : 'w-full rounded-lg justify-between gap-3 py-2 px-3',
                            isActive && !isCollapsed
                              ? 'bg-primary/10'
                              : !isActive && (isCollapsed ? 'hover:bg-muted/30' : 'hover:bg-muted/30'),
                            isEditing && 'bg-muted/60'
                          )}
                          onClick={() => {
                            if (isEditing || isRenaming) return;
                            onChatSelect(chat.id);
                          }}
                          title={!isCollapsed && !isEditing ? chat.title : undefined}
                        >
                          <div className={cn('flex items-center gap-3 flex-1 min-w-0', isCollapsed && 'justify-center')}>
                            <Avatar
                              className={cn(
                                'h-9 w-9 shrink-0 transition-all duration-200',
                                isActive && 'ring-2 ring-primary'
                              )}
                            >
                              <AvatarFallback
                                className={cn(
                                  'flex h-full w-full items-center justify-center text-xs font-medium uppercase',
                                  getChatAvatarClasses(chat.title)
                                )}
                              >
                                {getChatInitials(chat.title)}
                              </AvatarFallback>
                            </Avatar>
                            <div className={cn('flex-1 min-w-0', isCollapsed && 'hidden')}>
                              {isEditing ? (
                                <Input
                                  ref={editingChatId === chat.id ? renameInputRef : undefined}
                                  value={renameValue}
                                  onChange={(event) => setRenameValue(event.target.value)}
                                  onClick={(event) => event.stopPropagation()}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                      event.preventDefault();
                                      handleRenameSubmit(chat.id);
                                    }
                                    if (event.key === 'Escape') {
                                      event.preventDefault();
                                      handleCancelRename();
                                    }
                                  }}
                                  placeholder="Chat title"
                                  className="h-8"
                                  disabled={isRenaming}
                                />
                              ) : (
                                <>
                                  <p className={cn('truncate text-sm font-medium', isActive ? 'text-foreground/85 font-semibold' : 'text-foreground/85')}>{chat.title}</p>
                                  <p className={cn('truncate text-xs', isActive ? 'text-foreground/60' : 'text-muted-foreground/70')}>{relativeTime}</p>
                                </>
                              )}
                            </div>
                          </div>
                          <div className={cn('flex items-center gap-2', isCollapsed && 'hidden')}>
                            {isEditing ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg text-primary hover:bg-primary/10"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleRenameSubmit(chat.id);
                                  }}
                                  disabled={isRenaming || !renameValue.trim()}
                                  aria-label="Save chat title"
                                >
                                  {isRenaming ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted/70"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleCancelRename();
                                  }}
                                  disabled={isRenaming}
                                  aria-label="Cancel chat rename"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                                    onClick={(event) => event.stopPropagation()}
                                    aria-label="Chat actions"
                                  >
                                    <EllipsisVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" side="right">
                                  <DropdownMenuItem
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleStartRename(chat);
                                    }}
                                  >
                                    <Pencil className="mr-2 h-4 w-4 text-muted-foreground" /> Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      if (editingChatId === chat.id) {
                                        handleCancelRename();
                                      }
                                      onDeleteChat(chat.id);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      {(isCollapsed || chat.title.length > 26) && !isEditing && (
                        <TooltipContent side="right" align="center">
                          <p className="font-medium">{chat.title}</p>
                          {relativeTime && (
                            <p className="text-sm text-muted-foreground">{relativeTime}</p>
                          )}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

  <div className="sticky bottom-0 border-t border-border/60 bg-background/95 px-4 py-3">
       <UserMenu user={user} isCollapsed={isCollapsed} />
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

export const ChatSidebar = React.memo(ChatSidebarComponent);