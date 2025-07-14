
'use client';

import {
  useState,
  useRef,
  ChangeEvent,
  FormEvent,
  useEffect,
  useCallback,
} from 'react';
import Image from 'next/image';
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
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea';
import type { Attachment } from '@/hooks/use-file-upload';

const MIN_HEIGHT = 48;
const MAX_HEIGHT = 164;

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
  handleSendMessage: (e: FormEvent) => void;
  handleFileSelect: (file: File) => void;
  onSelectPrompt: (prompt: string) => void;
  isSending: boolean;
  isHistoryLoading: boolean;
  personas: any[];
  selectedPersonaId: string;
  setSelectedPersonaId: (id: string) => void;
  activeChatId: string | null;
  chatContext: Attachment | null;
  clearChatContext: () => void;
  // Remove textareaRef from props as the hook will manage it internally
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
      className="pointer-events-none absolute text-base text-muted-foreground"
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
  onSelectPrompt,
  isSending,
  isHistoryLoading,
  personas,
  selectedPersonaId,
  setSelectedPersonaId,
  activeChatId,
  chatContext,
  clearChatContext,
}: ChatInputAreaProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: MIN_HEIGHT,
    maxHeight: MAX_HEIGHT,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustHeight();
  };

  const handleSubmit = (e: FormEvent) => {
    handleSendMessage(e);
    // Use a timeout to allow the message to be sent before resetting height
    setTimeout(() => adjustHeight(true), 100);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAttachment = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    clearChatContext();
  };

  // Adjust height when input is cleared externally (e.g., after sending)
  useEffect(() => {
    if (!input) {
      adjustHeight(true);
    }
  }, [input, adjustHeight]);

  return (
    <div className="w-full py-4">
      <div className="relative max-w-4xl border rounded-[22px] border-border/60 bg-secondary/50 p-1 w-full mx-auto shadow-sm">
        <div className="relative rounded-2xl border border-border/60 bg-background flex flex-col">
          <AnimatePresence>
            {chatContext && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: 20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: 20 }}
                className="p-2"
              >
                <div className="relative w-24 h-24 rounded-lg overflow-hidden ml-4">
                  <Image
                    src={chatContext.url}
                    alt="Attachment preview"
                    layout="fill"
                    objectFit="cover"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleClearAttachment}
                    className="bg-background/50 hover:bg-background/80 text-foreground absolute top-1 right-1 h-6 w-6 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div
            className="overflow-y-auto"
            style={{ maxHeight: `${MAX_HEIGHT}px` }}
          >
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                placeholder=""
                className="w-full rounded-2xl px-4 py-3 bg-transparent border-none text-base text-foreground resize-none focus-visible:ring-0 leading-[1.4]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                onChange={handleTextareaChange}
                disabled={isHistoryLoading}
              />
              {!input && (
                <div className="absolute left-4 top-3.5">
                  <AnimatedPlaceholder activeChatId={activeChatId} />
                </div>
              )}
            </div>
          </div>

          <div className="h-14 bg-background rounded-b-xl flex items-center justify-between px-3">
            <div className="flex items-center gap-1">
              <PromptLibrary onSelectPrompt={onSelectPrompt} />
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
                <PopoverContent
                  align="start"
                  className="w-[340px] p-0 mb-2"
                >
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
            <div className="flex items-center">
              <Button
                type="button"
                onClick={handleSubmit}
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
        </div>
      </div>
    </div>
  );
}
