
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
      console.log('[MultimodalInput] handleFileChange triggered');
      const file = event.target.files?.[0];
      if (!file) {
        console.log('[MultimodalInput] No file selected');
        return;
      }
      console.log('[MultimodalInput] File selected:', file.name, file.type, file.size);

      setIsUploading(true);

      console.log('[MultimodalInput] Starting upload for file:', file.name);

      try {
        // Upload file to Gemini API
        const formData = new FormData();
        formData.append('file', file);
        console.log('[MultimodalInput] FormData prepared, size approx (bytes):', file.size);

        console.log('[MultimodalInput] Sending POST /api/chat/upload');
        const response = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
        });

        console.log('[MultimodalInput] Upload response status:', response.status);

        if (!response.ok) {
          let errorBody: any = null;
          try {
            errorBody = await response.json();
          } catch (e) {
            console.warn('[MultimodalInput] Could not parse error JSON from upload response');
          }
          console.error('[MultimodalInput] Upload failed, response:', errorBody || await response.text().catch(() => '<no body>'));
          throw new Error(errorBody?.error || 'Upload failed');
        }

        const result = await response.json();
        console.log('[MultimodalInput] Upload result payload:', result);
        
        // Add uploaded file to attachments with Gemini URI
        const newAttachment = {
          url: result.file.uri, // Gemini file URI
          name: result.file.displayName || file.name,
          contentType: result.file.mimeType,
          size: parseInt(result.file.sizeBytes || '0'),
        };
        console.log('[MultimodalInput] Adding attachment to state:', newAttachment.url);
        setAttachments(prev => [...prev, newAttachment]);

      } catch (error) {
        console.error('[MultimodalInput] File upload error:', error);
        // Show error to user (you might want to add a toast notification here)
        alert(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsUploading(false);
        console.log('[MultimodalInput] Upload finished, isUploading set to false');
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

  {/* Clean input box inspired by Gemini - subtle border, integrated tools */}
  <div className="relative flex items-end gap-3 rounded-3xl border border-border/60 bg-card/50 backdrop-blur-sm px-1.5 py-1.5 shadow-sm hover:border-border/80 focus-within:border-primary/40 focus-within:shadow-md transition-all duration-200">
          
          <div className="flex items-center gap-1 pl-2">
            <PersonaSelector
              personas={personas || []}
              selectedPersonaId={selectedPersonaId}
              onSelect={setSelectedPersonaId}
              className="h-8 w-8 rounded-full text-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors"
            />

            {isUploading ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-foreground/60"
                disabled={true}
                aria-label="Uploading file..."
              >
                <LoaderIcon className="h-4 w-4 animate-spin" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer rounded-full text-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors"
                onClick={() => {
                  console.log('[MultimodalInput] Paperclip button clicked, triggering file input.');
                  fileInputRef.current?.click();
                }}
                aria-label="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,application/pdf,text/*,audio/*,video/*"
            aria-label="Upload file"
            disabled={isUploading}
          />
          
          <Textarea
            ref={internalTextareaRef}
            placeholder="Ask anything..."
            value={input}
            onChange={handleInput}
            onFocus={handleFocus}
            className="flex-1 resize-none border-none bg-transparent px-2 py-2 text-[15px] leading-6 text-foreground placeholder:text-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 font-normal"
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
            className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted/50 disabled:text-muted-foreground transition-colors shadow-sm"
            aria-label={isGenerating ? "Generating response..." : "Send message"}
          >
            {isGenerating ? (
              <LoaderIcon className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Send className="h-4.5 w-4.5" />
            )}
          </Button>
        </div>
      </form>
    );
  }
);
PureMultimodalInput.displayName = 'PureMultimodalInput';

export { PureMultimodalInput as MultimodalInput };
