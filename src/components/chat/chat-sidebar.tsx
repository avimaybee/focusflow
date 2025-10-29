'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LogIn,
  LogOut,
  Plus,
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
  'bg-sky-500/15 text-sky-100 ring-1 ring-sky-500/30',
  'bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-500/30',
  'bg-purple-500/15 text-purple-100 ring-1 ring-purple-500/30',
  'bg-amber-500/15 text-amber-100 ring-1 ring-amber-500/30',
  'bg-rose-500/15 text-rose-100 ring-1 ring-rose-500/30',
  'bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-500/30',
  'bg-violet-500/15 text-violet-100 ring-1 ring-violet-500/30',
  'bg-lime-500/15 text-lime-100 ring-1 ring-lime-500/30',
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
      // Placeholder for logout
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out (placeholder).',
      });
      router.push('/');
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

const UserMenu = ({ user, isCollapsed }: { user: SupabaseUser | null, isCollapsed: boolean }) => {
  const authModal = useAuthModal();
  const { isPremium, profile } = useAuth();
  const displayName = profile?.username || user?.email?.split('@')[0] || 'User';
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
                  src={user?.user_metadata?.avatar_url || undefined}
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
  onRefreshHistory,
}: ChatSidebarProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [editingChatId, setEditingChatId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState('');
  const [isRenaming, setIsRenaming] = React.useState(false);
  const renameInputRef = React.useRef<HTMLInputElement | null>(null);

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

  const groupedChatHistory = React.useMemo(() => groupChatHistory(chatHistory || []), [chatHistory]);

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
                {groupedChatHistory.length === 0 && (chatHistory || []).length === 0 && (
                  <p className="text-sm text-muted-foreground px-2 py-4 text-center">
                    Start a conversation to see it appear here.
                  </p>
                )}
                {groupedChatHistory.map((group, groupIndex) => (
                  <div key={group.key} className="space-y-1">
                    {isCollapsed ? (
                      groupIndex > 0 && <div className="mx-auto my-2 h-px w-6 bg-border/50" />
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
                            'flex w-full items-center font-normal py-2 px-3 rounded-lg cursor-pointer text-foreground transition-all duration-200 group/item',
                            isActive
                              ? 'bg-muted ring-1 ring-primary/30'
                              : 'hover:bg-muted/80',
                            isCollapsed
                              ? 'justify-center items-center h-10 w-10 p-0'
                              : 'justify-between gap-3',
                            isEditing && 'ring-1 ring-primary/40 bg-muted'
                          )}
                          onClick={() => {
                            if (isEditing || isRenaming) return;
                            onChatSelect(chat.id);
                          }}
                          title={!isCollapsed && !isEditing ? chat.title : undefined}
                        >
                          <div className={cn('flex items-center gap-3 flex-1 min-w-0', isCollapsed && 'justify-center')}>
                            <Avatar className={cn('h-8 w-8 shrink-0 transition-all duration-200', isActive && !isEditing && 'ring-1 ring-primary/50 shadow-sm')}>
                              <AvatarFallback
                                className={cn(
                                  'h-full w-full text-[11px] font-semibold uppercase tracking-wide flex items-center justify-center',
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
                                  <p className="truncate font-medium text-sm">{chat.title}</p>
                                  <p className="truncate text-xs text-muted-foreground">{relativeTime}</p>
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
                                  className="h-7 w-7"
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
                                  className="h-7 w-7"
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
                                    className="h-6 w-6"
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
                                    Rename
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
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
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
                                    <AvatarImage src={user?.user_metadata?.avatar_url || undefined} data-ai-hint="person" />
                                    <AvatarFallback>{user ? (profile?.username || user.email || 'U').charAt(0).toUpperCase() : <User />}</AvatarFallback>
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