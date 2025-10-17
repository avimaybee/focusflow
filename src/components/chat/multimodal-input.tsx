
'use client';

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 as LoaderIcon, X as XIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import {
  Users,
  Check,
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
  Paperclip,
  Send,
  File as FileIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea';
import type { Attachment } from '@/types/chat-types';

// Minimal UIMessage type used by this component (wasn't exported from chat-types)
type UIMessage = { id: string; content: string; role: string };

// Type Definitions
type VisibilityType = 'public' | 'private' | 'unlisted' | string;

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

// Main Component

interface MultimodalInputProps {
  chatId: string;
  messages: Array<UIMessage>;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  onSendMessage: (params: { input: string; attachments: Attachment[] }) => void;
  onStopGenerating: () => void;
  onFocus?: () => void;
  isGenerating: boolean;
  canSend: boolean;
  className?: string;
  selectedVisibilityType: VisibilityType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  personas: any[];
  selectedPersonaId: string;
  setSelectedPersonaId: (id: string) => void;
}

const PureMultimodalInput = React.forwardRef<HTMLTextAreaElement, MultimodalInputProps>(
  ({
    attachments,
    setAttachments,
    onSendMessage,
    onStopGenerating,
    onFocus,
    isGenerating,
    canSend,
    className,
    personas,
    selectedPersonaId,
    setSelectedPersonaId,
  }, ref) => {
    // useAutoResizeTextarea returns the textareaRef and adjustHeight helper
    const { textareaRef: internalTextareaRef, adjustHeight } = useAutoResizeTextarea({
      minHeight: 24,
      maxHeight: 200,
    });
    React.useImperativeHandle(ref, () => internalTextareaRef.current! as HTMLTextAreaElement);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const [input, setInput] = useState('');
    const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
    
    // adjustHeight is provided by the hook above; don't call the hook again

    const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(event.target.value);
    };
    
    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachments([{
          url: e.target?.result as string,
          name: file.name,
          contentType: file.type,
          size: file.size,
        }]);
      };
      reader.readAsDataURL(file);
      
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
    };

    const handleRemoveAttachment = useCallback(
      (attachmentToRemove: Attachment) => {
        setAttachments((currentAttachments) =>
          currentAttachments.filter(
            (attachment) => attachment.url !== attachmentToRemove.url
          )
        );
        internalTextareaRef.current?.focus();
      },
      [setAttachments, internalTextareaRef]
    );

    const submitForm = useCallback(() => {
      if (input.trim().length === 0 && attachments.length === 0) {
          return;
      }
      onSendMessage({ input, attachments });
      setInput('');
      setAttachments([]);
      adjustHeight(true);
    }, [input, attachments, onSendMessage, setAttachments, adjustHeight]);

    const handleFocus = () => {
        if (onFocus) onFocus();
        if(formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
      <form 
        ref={formRef} 
        className={cn("relative w-full", className)}
        onSubmit={(e) => {
          e.preventDefault();
          submitForm();
        }}
      >
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          tabIndex={-1}
          disabled={isGenerating}
          accept="image/*,application/pdf,text/*"
        />

        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, paddingBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', paddingBottom: '0.75rem' }}
              exit={{ opacity: 0, height: 0, paddingBottom: 0 }}
              className="px-1"
            >
              {attachments.map((attachment) => (
                 <div key={attachment.url} className="inline-flex items-center gap-2 rounded-full bg-secondary border border-border py-1 pl-2 pr-1 text-sm">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{attachment.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveAttachment(attachment)}
                      className="h-6 w-6 rounded-full"
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-end rounded-xl border bg-secondary/80 shadow-sm focus-within:ring-2 focus-within:ring-primary/50 p-2 transition-shadow">
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
                    {(personas || []).map((p) => {
                      const Icon = personaIcons[p.id] || Bot;
                      return (
                        <CommandItem
                          key={p.id}
                          value={p.id}
                          onSelect={() => {
                            setSelectedPersonaId(p.id);
                            setPersonaMenuOpen(false);
                          }}
                          className="group flex items-start gap-3 cursor-pointer py-2.5"
                        >
                          <Icon className="h-5 w-5 mt-0.5 text-muted-foreground group-hover:text-foreground" />
                          <div className="text-left flex-1">
                            <p className="font-semibold text-sm">
                              {p.name}
                            </p>
                            <p className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">
                              {p.description}
                            </p>
                          </div>
                          {selectedPersonaId === p.id && (
                            <Check className="h-4 w-4 mr-2 opacity-100" />
                          )}
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
          
          <Textarea
            ref={internalTextareaRef}
            placeholder="Send a message..."
            value={input}
            onChange={handleInput}
            onFocus={handleFocus}
            className="flex-1"
            rows={1}
            disabled={!canSend || isGenerating}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                submitForm();
              }
            }}
          />

          <Button
            type="button"
            onClick={submitForm}
            disabled={isGenerating || (!input.trim() && attachments.length === 0)}
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full premium-gradient hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground"
          >
            {isGenerating ? (
              <LoaderIcon className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </form>
    );
  }
);
PureMultimodalInput.displayName = 'PureMultimodalInput';

export { PureMultimodalInput as MultimodalInput };
