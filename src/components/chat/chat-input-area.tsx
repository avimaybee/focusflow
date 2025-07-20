
'use client';

import {
  useState,
  useRef,
  ChangeEvent,
  FormEvent,
  useCallback,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Paperclip,
  Send,
  X,
  Users,
  Check,
  Loader2,
  Bot,
  Baby,
  MessageSquare,
  Zap,
  ThumbsDown,
  List,
  GraduationCap,
  Lightbulb,
  Clock,
  Drama,
  Plus,
  File,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea';

// Mapping persona IDs to icons
const personaIcons: { [key: string]: React.ElementType } = {
  neutral: Bot,
  'five-year-old': Baby,
  casual: MessageSquare,
  entertaining: Zap,
  'brutally-honest': ThumbsDown,
  'straight-shooter': List,
  'essay-sharpshooter': GraduationCap,
  'idea-generator': Lightbulb,
  'cram-buddy': Clock,
  sassy: Drama,
};

interface ChatInputAreaProps {
  input: string;
  setInput: (value: string) => void;
  handleSendMessage: (e: FormEvent, prompt?: string) => void;
  handleFileSelect: (file: File) => void;
  isSending: boolean;
  isHistoryLoading: boolean;
  personas: any[];
  selectedPersonaId: string;
  setSelectedPersonaId: (id: string) => void;
  activeChatId: string | null;
  chatContext: Attachment | null;
  clearChatContext: () => void;
}

const AnimatedPlaceholder = ({
  activeChatId,
}: {
  activeChatId: string | null;
}) => (
  <AnimatePresence mode="wait">
    <motion.p
      key={activeChatId ? 'follow-up' : 'new-chat'}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.15 }}
      className="pointer-events-none text-base text-muted-foreground whitespace-nowrap"
    >
      {activeChatId ? 'Ask a follow-up...' : 'Start a new conversation...'}
    </motion.p>
  </AnimatePresence>
);

export function ChatInputArea({
  input,
  setInput,
  handleSendMessage,
  handleFileSelect,
  isSending,
  isHistoryLoading,
  personas,
  selectedPersonaId,
  setSelectedPersonaId,
  activeChatId,
  chatContext,
  clearChatContext,
}: ChatInputAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 24, // Matches the leading-normal (1.5rem)
    maxHeight: 200,
  });

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustHeight();
  };

  const handleSubmit = (e: FormEvent, prompt?: string) => {
    e.preventDefault();
    const messageToSend = prompt || input;
    if (!messageToSend.trim() && !chatContext) return;
    handleSendMessage(e, messageToSend);
    // After sending, reset the textarea height
    adjustHeight(true);
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAttachment = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    clearChatContext();
  };

  return (
    <div className="w-full p-4">
      <div className="relative max-w-4xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="relative rounded-2xl bg-background shadow-lg border border-border/20"
        >
          <AnimatePresence>
            {chatContext && (
              <motion.div
                initial={{ opacity: 0, height: 0, paddingBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', paddingBottom: '0.75rem' }}
                exit={{ opacity: 0, height: 0, paddingBottom: 0 }}
                className="px-4 pt-3"
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-secondary border border-border py-1 pl-2 pr-1 text-sm">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{chatContext.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleClearAttachment}
                    className="h-6 w-6 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-end gap-2 p-3">
            <div className="flex items-center gap-1">
               <Popover open={personaMenuOpen} onOpenChange={setPersonaMenuOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-muted"
                  >
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
                                <p className="font-semibold text-sm text-foreground">
                                  {p.name}
                                </p>
                                <p className="text-xs text-muted-foreground group-hover:text-foreground/80">
                                  {p.description}
                                </p>
                              </div>
                              <Check
                                className={cn(
                                  'h-4 w-4 mr-2',
                                  selectedPersonaId === p.id
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-9 w-9 cursor-pointer rounded-full text-muted-foreground hover:bg-muted"
              >
                <label>
                  <Paperclip className="w-5 h-5" />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,application/pdf,text/*"
                  />
                </label>
              </Button>
            </div>
            
            <div className="relative flex-1 min-h-[2.25rem] flex items-center">
               <Textarea
                ref={textareaRef}
                value={input}
                placeholder=""
                rows={1}
                className="w-full bg-transparent border-none text-base text-foreground resize-none focus-visible:ring-0 p-0 leading-normal"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    handleSubmit(e);
                  }
                }}
                onChange={handleTextareaChange}
                disabled={isHistoryLoading}
              />
              {!input && !chatContext && (
                <div className="absolute inset-0 flex items-center pointer-events-none">
                   <AnimatedPlaceholder activeChatId={activeChatId} />
                </div>
              )}
            </div>
            
            <div className="flex items-center">
              <Button
                type="submit"
                disabled={isSending || (!input.trim() && !chatContext)}
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
