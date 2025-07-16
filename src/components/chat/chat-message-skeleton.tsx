import { Bot } from 'lucide-react';

export function ChatMessageSkeleton() {
  return (
    <div className="flex items-start gap-4 py-6">
      <div className="bg-secondary rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0 border">
        <Bot className="w-6 h-6 text-primary" />
      </div>
      <div className="flex items-center gap-2 pt-2">
        <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
        <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
        <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
}
