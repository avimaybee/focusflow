
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import type { User as FirebaseUser } from 'firebase/auth';
import type { ChatHistoryItem } from '@/hooks/use-chat-history';

interface ChatSidebarProps {
  user: FirebaseUser | null;
  chatHistory: ChatHistoryItem[];
  activeChatId: string | null;
  onNewChat: () => void;
  onChatSelect: (id: string) => void;
  isLoading: boolean;
}

const SidebarSkeleton = () => (
    <div className="p-4 space-y-4">
        <div className="h-8 bg-muted/50 rounded-md animate-pulse"></div>
        <div className="h-8 bg-muted/50 rounded-md animate-pulse w-2/3"></div>
        <div className="h-8 bg-muted/50 rounded-md animate-pulse w-5/6"></div>
        <div className="h-8 bg-muted/50 rounded-md animate-pulse w-4/5"></div>
    </div>
);

export function ChatSidebar({
  user,
  chatHistory,
  activeChatId,
  onNewChat,
  onChatSelect,
  isLoading,
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
      router.push('/login');
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "An error occurred while logging out. Please try again.",
      });
    }
  };


  return (
    <aside className="w-80 flex-col bg-secondary/30 p-4 border-r border-border/60 hidden md:flex group/sidebar">
      <div className="flex items-center justify-between mb-4 mt-2">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <Logo className="h-7 w-7 hover:scale-105 transition-transform" />
          FocusFlow AI
        </Link>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNewChat}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 -mx-4">
        {isLoading ? <SidebarSkeleton /> : (
            <div className="px-4 py-2 space-y-1">
            {chatHistory.map((chat) => (
                <Button
                key={chat.id}
                variant={activeChatId === chat.id ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3 font-normal py-3 px-4 hover:bg-muted/50 text-foreground"
                onClick={() => onChatSelect(chat.id)}
                >
                <span className="truncate">{chat.title}</span>
                </Button>
            ))}
            </div>
        )}
      </ScrollArea>
      <div className="py-2 mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 text-sm h-auto py-2 px-2 hover:bg-muted/50">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || undefined} data-ai-hint="person" />
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
              <div className="text-left">
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
            <Button asChild variant="outline" className="w-full my-1">
              <Link href="/premium">
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Link>
            </Button>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
