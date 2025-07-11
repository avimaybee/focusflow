
'use client';

import { useRef, ChangeEvent, FormEvent } from 'react';
import {
  Paperclip,
  Send,
  X,
  FileIcon,
  Users,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { PromptLibrary } from '@/components/prompt-library';
import { cn } from '@/lib/utils';
import type { Attachment } from '@/hooks/use-file-upload';

interface ChatInputAreaProps {
  input: string;
  setInput: (value: string) => void;
  attachments: Attachment[];
  dispatch: React.Dispatch<any>;
  handleSendMessage: (e: FormEvent) => void;
  handleFileSelect: (file: File) => void;
  onSelectPrompt: (prompt: string) => void;
  isLoading: boolean;
  isHistoryLoading: boolean;
  personas: any[];
  selectedPersonaId: string;
  setSelectedPersonaId: (id: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  activeChatId: string | null;
}

export function ChatInputArea({
  input,
  setInput,
  attachments,
  dispatch,
  handleSendMessage,
  handleFileSelect,
  onSelectPrompt,
  isLoading,
  isHistoryLoading,
  personas,
  selectedPersonaId,
  setSelectedPersonaId,
  textareaRef,
  activeChatId,
}: ChatInputAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-4">
      <div className="relative max-w-full sm:max-w-3xl lg:max-w-4xl mx-auto">
        {attachments.length > 0 && (
          <div className="p-2 border-b border-border/60">
            <div className="flex items-center gap-2 flex-wrap">
              {attachments.map((att, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted p-1.5 rounded-md text-sm">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground truncate max-w-[120px]">{att.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full"
                    onClick={() => dispatch({ type: 'CLEAR_ATTACHMENTS' })}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-start p-2 gap-2 bg-card border border-border/60 rounded-xl shadow-lg">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted">
                <Users className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[340px] p-0 mb-2">
              <Command>
                <CommandInput placeholder="Select a persona..." />
                <CommandList>
                  <CommandEmpty>No persona found.</CommandEmpty>
                  <CommandGroup>
                    {personas.map((p) => (
                      <CommandItem
                        key={p.id}
                        value={p.id}
                        onSelect={(currentValue) => setSelectedPersonaId(currentValue)}
                        className="flex items-start gap-3 cursor-pointer py-2.5"
                      >
                        <div className={cn(
                          "mt-1 mr-2 h-4 w-4",
                          selectedPersonaId === p.id ? "opacity-100" : "opacity-0"
                        )} />
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5" />
                          <div className="text-left">
                            <p className="font-semibold text-sm">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.description}</p>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <PromptLibrary onSelectPrompt={onSelectPrompt} />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            className="hidden"
            accept="image/*,application/pdf,text/*"
          />

          <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={activeChatId ? "Ask a follow-up..." : "Start a new conversation..."}
              className="w-full resize-none bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 max-h-48 text-foreground placeholder-muted-foreground"
              rows={1}
              disabled={isHistoryLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || (!input.trim() && attachments.length === 0) || isHistoryLoading}
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
