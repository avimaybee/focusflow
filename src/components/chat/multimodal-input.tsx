
'use client';

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useImperativeHandle,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 as LoaderIcon, X as XIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PersonaSelector } from '@/components/chat/persona-selector';

import {
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

// Main Component

export interface MultimodalInputHandle {
  focus: () => void;
  setDraft: (value: string) => void;
  submit: () => void;
  clear: () => void;
  getTextarea: () => HTMLTextAreaElement | null;
}

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

const PureMultimodalInput = React.forwardRef<MultimodalInputHandle, MultimodalInputProps>(
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
      minHeight: 40,
      maxHeight: 220,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const [input, setInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const scheduleAdjustHeight = useCallback(() => {
      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        window.requestAnimationFrame(() => adjustHeight());
        return;
      }
      adjustHeight();
    }, [adjustHeight]);
    
    // adjustHeight is provided by the hook above; don't call the hook again

    const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextValue = event.target.value;
      setInput(nextValue);
      scheduleAdjustHeight();
    };
    
    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);

      try {
        // Upload file to Gemini API
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();
        
        // Add uploaded file to attachments with Gemini URI
        setAttachments(prev => [...prev, {
          url: result.file.uri, // Gemini file URI
          name: result.file.displayName || file.name,
          contentType: result.file.mimeType,
          size: parseInt(result.file.sizeBytes || '0'),
        }]);

      } catch (error) {
        console.error('File upload error:', error);
        // Show error to user (you might want to add a toast notification here)
        alert(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
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

    useImperativeHandle(ref, () => ({
      focus: () => {
        internalTextareaRef.current?.focus();
      },
      setDraft: (value: string) => {
        setInput(value);
        requestAnimationFrame(() => {
          adjustHeight(true);
          if (internalTextareaRef.current) {
            internalTextareaRef.current.focus();
            const length = value.length;
            try {
              internalTextareaRef.current.setSelectionRange(length, length);
            } catch (error) {
              // Ignore selection errors (e.g., unsupported input types)
            }
          }
        });
      },
      submit: () => {
        submitForm();
      },
      clear: () => {
        setInput('');
        setAttachments([]);
        adjustHeight(true);
      },
      getTextarea: () => internalTextareaRef.current,
    }), [adjustHeight, internalTextareaRef, scheduleAdjustHeight, setAttachments, submitForm]);

    useEffect(() => {
      scheduleAdjustHeight();
    }, [input, scheduleAdjustHeight]);

    const handleFocus = () => {
        if (onFocus) onFocus();
        if(formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        scheduleAdjustHeight();
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

  {/* Enhanced input box with strong visual presence and interaction feedback */}
  <div className="relative flex items-end gap-2.5 rounded-2xl border border-border/80 bg-card px-4 py-3 shadow-lg hover:shadow-xl focus-within:border-border focus-within:bg-card focus-within:ring-4 focus-within:ring-primary/20 focus-within:shadow-2xl transition-all duration-200 hover:border-border">
          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-background/10 to-transparent pointer-events-none"></div>
          
          <PersonaSelector
            personas={personas || []}
            selectedPersonaId={selectedPersonaId}
            onSelect={setSelectedPersonaId}
            className="relative z-10 h-10 w-10 rounded-full text-foreground/70 hover:text-foreground hover:bg-accent/80 transition-all hover:scale-105"
          />

          <Button
            asChild={!isUploading}
            variant="ghost"
            size="icon"
            className="relative z-10 h-10 w-10 cursor-pointer rounded-full text-foreground/70 hover:text-foreground hover:bg-accent/80 transition-all hover:scale-105"
            disabled={isUploading}
            aria-label="Attach file"
          >
            {isUploading ? (
              <LoaderIcon className="h-5 w-5 animate-spin" />
            ) : (
              <label>
                <Paperclip className="w-5 h-5" />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,application/pdf,text/*,audio/*,video/*"
                  aria-label="Upload file"
                />
              </label>
            )}
          </Button>
          
          <Textarea
            ref={internalTextareaRef}
            placeholder="Type your message... (Shift + Enter for new line)"
            value={input}
            onChange={handleInput}
            onFocus={handleFocus}
            className="relative z-10 flex-1 resize-none border-none bg-transparent px-0 text-base leading-6 text-foreground placeholder:text-foreground/45 focus-visible:ring-0 focus-visible:ring-offset-0 font-normal"
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
            className="relative z-10 h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110 hover:shadow-xl hover:shadow-primary/30 disabled:bg-muted disabled:text-muted-foreground disabled:hover:scale-100 transition-all duration-200 shadow-lg shadow-primary/20 active:scale-95"
            aria-label={isGenerating ? "Generating response..." : "Send message"}
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
