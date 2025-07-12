
'use client';

import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Paperclip,
  Send,
  X,
  FileIcon,
  Users,
  Check,
  Loader2,
  GraduationCap,
  Bot,
  Brain,
  MessageSquare,
  Zap,
  ThumbsDown,
  PenLine,
  Lightbulb,
  Baby,
  Clock,
  Drama,
  List,
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

// Mapping persona IDs to icons
const personaIcons: { [key: string]: React.ElementType } = {
    'neutral': Bot,
    'five-year-old': Baby,
    'casual': MessageSquare,
    'entertaining': Zap,
    'brutally-honest': ThumbsDown,
    'straight-shooter': List,
    'essay-sharpshooter': GraduationCap,
    'idea-generator': Lightbulb,
    'cram-buddy': Clock,
    'sassy': Drama,
};

interface ChatInputAreaProps {
  input: string;
  setInput: (value: string) => void;
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
  chatContext: { name: string; type: string; } | null;
  clearChatContext: () => void;
}

export function ChatInputArea({
  input,
  setInput,
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
  chatContext,
  clearChatContext,
}: ChatInputAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contextName = chatContext?.name || null;
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);

  const buttonVariants = {
    hover: { scale: 1.1 },
    tap: { scale: 0.95 }
  };

  return (
    <div className="relative max-w-full sm:max-w-3xl lg:max-w-4xl mx-auto bg-background">
      <div className="p-2 border-y border-border/60 flex items-center gap-2 flex-wrap">
          {contextName && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 bg-muted p-1.5 rounded-md text-sm">
                <FileIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground truncate max-w-[120px]">Context: {contextName}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={clearChatContext}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          )}
      </div>
      <div className="flex items-start p-2 bg-transparent">
        <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
          <PromptLibrary onSelectPrompt={onSelectPrompt} />
        </motion.div>

        <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
          <Popover open={personaMenuOpen} onOpenChange={setPersonaMenuOpen}>
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
                    {personas.map((p) => {
                      const Icon = personaIcons[p.id] || Bot;
                      return (
                        <CommandItem
                          key={p.id}
                          value={p.id}
                          onSelect={(currentValue) => {
                            setSelectedPersonaId(currentValue);
                            setPersonaMenuOpen(false);
                          }}
                          className="group flex items-start gap-3 cursor-pointer py-2.5"
                        >
                          <Icon className="h-5 w-5 mt-0.5 text-muted-foreground group-hover:text-foreground" />
                          <div className="text-left flex-1">
                            <p className="font-semibold text-sm text-foreground">{p.name}</p>
                            <p className="text-xs text-muted-foreground group-hover:text-foreground/80">{p.description}</p>
                          </div>
                          <Check className={cn("h-4 w-4 mr-2", selectedPersonaId === p.id ? "opacity-100" : "opacity-0")} />
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </motion.div>

        <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </motion.div>
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
          <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
            <Button
              type="submit"
              disabled={isLoading || (!input.trim() && !chatContext) || isHistoryLoading}
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
