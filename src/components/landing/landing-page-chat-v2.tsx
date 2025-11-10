'use client';

import { useState, FormEvent, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { marked } from 'marked';
import { usePersonaManager } from '@/hooks/use-persona-manager';
import { Button } from '@/components/ui/button';
import { PersonaSelector } from '@/components/chat/persona-selector';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
    Send,
    Sparkles,
    Paperclip,
    X as XIcon,
    File as FileIcon,
    Loader2 as LoaderIcon,
} from 'lucide-react';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { PersonaIDs } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ChatMessageProps } from '@/components/chat/chat-message';
import type { Attachment } from '@/types/chat-types';

const suggestedPrompts = [
  "Explain photosynthesis in simple, kid-friendly steps",
  'Give 3 targeted exam strategy tips for a calculus final ',
  'Draft a 200-word academic intro on climate change',
  'Debug this JavaScript snippet and explain fixes step-by-step: [Paste code here]',
  'Create 5 flashcards for World War II causes with spaced-recall hints',
  'Brainstorm 10 project ideas for a class presentation — be playful and creative',
  'Summarize this paragraph concisely: [Paste text here]',
  'Generate a 3-question multiple-choice quiz on cellular respiration',
];

const welcomeMessage: ChatMessageProps = {
  id: 'welcome-1',
  role: 'model',
  text: 'Welcome to FocusFlow — meet the Personas. Each Persona has a different teaching style: Milo explains things simply, Lexi likes the Tea, Clairo crafts polished academic writing, Dex walks through code fixes step-by-step, Remi turns facts into memorable flashcards, and The Chef sparks creative ideas. <br/><br/> Pick a persona or paste a paragraph and see how that persona responds. Which one should we try first?',
};

const limitMessage: ChatMessageProps = {
    id: 'limit-1',
    role: 'model',
    text: 'Looks like you\'re getting the hang of it! You\'ve reached the demo limit. <br/><br/> Please sign up or log in to continue our chat—it\'s free and you\'ll get access to all the features!',
}

// Persona color mapping - matches actual ChatMessage component
const getPersonaColor = (personaId?: string): string => {
  if (!personaId) {
    return 'border-l-teal-500/50'; // Default
  }
  
  const id = (personaId || '').toLowerCase();
  
  // Map persona IDs to colors
  if (id === 'auto') {
    return 'border-l-violet-500/50';
  }
  
  if (id === 'gurt') {
    return 'border-l-teal-500/50';
  }
  
  if (id === 'im a baby' || id === 'milo') {
    return 'border-l-green-500/50';
  }
  
  if (id === 'straight shooter' || id === 'frank') {
    return 'border-l-cyan-500/50';
  }
  
  if (id === 'essay writer' || id === 'clairo') {
    return 'border-l-purple-500/50';
  }
  
  if (id === 'lore master' || id === 'syd') {
    return 'border-l-blue-500/50';
  }
  
  if (id === 'sassy tutor' || id === 'lexi') {
    return 'border-l-pink-500/50';
  }
  
  if (id === 'idea cook' || id === 'the chef') {
    return 'border-l-orange-500/50';
  }
  
  if (id === 'memory coach' || id === 'remi') {
    return 'border-l-amber-500/50';
  }
  
  if (id === 'code nerd' || id === 'dex') {
    return 'border-l-indigo-500/50';
  }
  
  if (id === 'exam strategist' || id === 'theo') {
    return 'border-l-rose-500/50';
  }
  
  return 'border-l-teal-500/50';
};

const Message = ({ message, personaId, personaName }: { message: ChatMessageProps; personaId?: string; personaName?: string }) => {
    const isModel = message.role === 'model';
    const personaColorClass = getPersonaColor(personaId);
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn('group flex w-full gap-3 px-4 py-3', isModel ? 'justify-start' : 'justify-end')}
        >
            <div className={cn('flex flex-col gap-1 max-w-2xl', isModel ? 'items-start' : 'items-end')}>
                {isModel && personaName && (
                    <div className="flex items-center gap-1 px-1">
                        <p className="text-xs font-medium text-foreground/60">{personaName}</p>
                    </div>
                )}
                <div
                    className={cn(
                        'relative w-full text-sm leading-relaxed',
                        isModel
                            ? cn('text-foreground/90 border-l-2 pl-4 pr-3 py-3', personaColorClass)
                            : 'bg-primary/15 text-foreground px-4 py-3 rounded-lg max-w-fit'
                    )}
                    dangerouslySetInnerHTML={{ __html: typeof message.text === 'string' ? message.text : '' }}
                />
            </div>
        </motion.div>
    );
};

const ThinkingIndicator = ({ personaName, personaId }: { personaName: string; personaId?: string }) => {
    const personaColorClass = getPersonaColor(personaId);
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="group flex w-full gap-3 px-4 py-3 justify-start"
        >
            <div className="flex flex-col gap-1 max-w-2xl items-start">
                <div className="flex items-center gap-1 px-1">
                    <p className="text-xs font-medium text-foreground/60">{personaName}</p>
                </div>
                <div className={cn('relative text-sm leading-relaxed text-foreground/90 border-l-2 pl-4 pr-3 py-3', personaColorClass)}>
                    <div className="font-sans font-bold text-muted-foreground">
                        {(personaName + " is thinking...").split("").map((char, i) => (
                            <motion.span
                            key={i}
                            className="inline-block"
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 0.5,
                                repeat: Infinity,
                                repeatType: "loop",
                                delay: i * 0.05,
                                ease: "easeInOut",
                                repeatDelay: 2,
                            }}
                            >
                            {char === " " ? "\u00A0" : char}
                            </motion.span>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};


export function LandingPageChatV2() {
  const [messages, setMessages] = useState<ChatMessageProps[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Generate new sessionId and guestId for each page load (ephemeral guest chat)
  const [sessionId] = useState<string>(uuidv4());
  const [guestId] = useState<string>(uuidv4());
  const { toast } = useToast();
  
  // Use Auto persona by default for the demo
  const { personas, selectedPersona, selectedPersonaId, setSelectedPersonaId, isLoading } = usePersonaManager(PersonaIDs.AUTO);
  const authModal = useAuthModal();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Debug: log personas when they load
  useEffect(() => {
    console.log('Landing page personas loaded:', personas.length, personas);
  }, [personas]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    console.log('[LandingPageChat] handleFileChange triggered');
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log('[LandingPageChat] No files selected');
      return;
    }
    console.log('[LandingPageChat] Files selected:', files.length);

    setIsUploading(true);

    try {
      // Upload all files
      const filesToUpload = Array.from(files);
      const uploadPromises = filesToUpload.map(async (file) => {
        console.log('[LandingPageChat] Starting upload for file:', file.name);

        try {
          const formData = new FormData();
          formData.append('file', file);
          console.log('[LandingPageChat] FormData prepared, size (bytes):', file.size);

          console.log('[LandingPageChat] Sending POST /api/chat/upload');
          const response = await fetch('/api/chat/upload', {
            method: 'POST',
            body: formData,
          });

          console.log('[LandingPageChat] Upload response status:', response.status);

          if (!response.ok) {
            let errorBody: unknown = null;
            let fallbackText: string | undefined;
            try {
              errorBody = await response.json();
            } catch {
              console.warn('[LandingPageChat] Could not parse error JSON from upload response');
              fallbackText = await response.text().catch(() => '<no body>');
            }
            const payloadForLog = errorBody ?? fallbackText ?? '<no body>';
            console.error('[LandingPageChat] Upload failed, response:', payloadForLog);
            const errorMessage = typeof errorBody === 'object' && errorBody !== null && 'error' in errorBody && typeof (errorBody as { error?: unknown }).error === 'string'
              ? (errorBody as { error: string }).error
              : undefined;
            throw new Error(errorMessage || 'Upload failed');
          }

          const result = await response.json();
          console.log('[LandingPageChat] Upload result payload:', result);
          
          // Add uploaded file to attachments with Gemini URI
          const sizeBytes = Number.parseInt(result.file.sizeBytes || `${file.size}`, 10);
          const remoteUri = result.file.uri as string | undefined;
          const newAttachment: Attachment = {
            url: remoteUri || '',
            remoteUrl: remoteUri,
            name: result.file.displayName || file.name,
            contentType: result.file.mimeType,
            size: Number.isFinite(sizeBytes) && sizeBytes >= 0 ? sizeBytes : file.size,
          };
          console.log('[LandingPageChat] Adding attachment to state:', newAttachment.remoteUrl);
          return newAttachment;
        } catch (error: unknown) {
          console.error('[LandingPageChat] File upload error for', file.name, ':', error);
          const message = error instanceof Error ? error.message : 'Unknown error';
          toast({ 
            variant: 'destructive', 
            title: 'Upload Failed', 
            description: `Failed to upload "${file.name}": ${message}` 
          });
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulAttachments = results.filter((att) => att !== null) as Attachment[];
      
      setAttachments(prev => [...prev, ...successfulAttachments]);

    } catch (error: unknown) {
      console.error('[LandingPageChat] Unexpected error during file upload:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({ 
        variant: 'destructive', 
        title: 'Upload Error', 
        description: message 
      });
    } finally {
      setIsUploading(false);
      console.log('[LandingPageChat] Upload finished, isUploading set to false');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = useCallback((attachmentToRemove: Attachment) => {
    setAttachments((currentAttachments) =>
      currentAttachments.filter((attachment) => {
        const removeKey = attachmentToRemove.remoteUrl ?? attachmentToRemove.url;
        const attachmentKey = attachment.remoteUrl ?? attachment.url;
        return attachmentKey !== removeKey;
      })
    );
  }, []);

  // Removed auto-scrolling behavior as per user request.

  const handleSendMessage = async (e: FormEvent, prompt?: string) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    
    const messageToSend = prompt || input;
    if (!messageToSend.trim() && attachments.length === 0 || isSending || limitReached) return;

    if (guestMessageCount >= 5) {
        setMessages(prev => [...prev, limitMessage]);
        authModal.onOpen('signup');
        setInput('');
        setAttachments([]);
        setLimitReached(true);
        return;
    }

  // keep placeholder suggestions rotating; no suggestion panel
    setIsSending(true);

    const userMessage: ChatMessageProps = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: await marked.parse(messageToSend.trim()),
    };
    setMessages(prev => ([...(prev || []), userMessage]));
    setGuestMessageCount(prev => prev + 1);

    setInput('');

    try {
      // Normalize attachments for API
      const normalizedAttachments = attachments.map(att => ({
        type: 'file_uri' as const,
        data: att.remoteUrl || att.url,
        mimeType: att.contentType,
        name: att.name,
        sizeBytes: att.size,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: messageToSend.trim(), 
          personaId: selectedPersonaId,
          sessionId: sessionId, // Pass sessionId
          guestId: guestId,     // Pass guestId
          attachments: normalizedAttachments.length > 0 ? normalizedAttachments : undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'An unknown error occurred.');

      // Determine which persona produced the response. The server may return
      // a persona object and/or autoSelection metadata when Auto is used.
      const responsePersonaId = typeof result?.persona?.id === 'string'
        ? result.persona.id
        : selectedPersonaId;

      const personaFromState = personas.find((p) => p.id === responsePersonaId);
      const mappedPersonaName = personaFromState?.name || result?.persona?.name || result?.persona?.display_name || responsePersonaId;

      const autoSelection = result?.autoSelection;
      const autoSelectedPersonaId = typeof autoSelection?.personaId === 'string' ? autoSelection.personaId : undefined;
      const autoSelectedPersonaName = typeof autoSelection?.personaName === 'string' ? autoSelection.personaName : undefined;

      const modelResponse: ChatMessageProps = {
        id: `guest-ai-${Date.now()}`,
        role: 'model',
        text: await marked.parse(result.response),
        // Provide persona metadata so the UI can show the resolved name when Auto selected
        personaId: responsePersonaId,
        persona: {
          id: responsePersonaId,
          name: mappedPersonaName,
          avatarUrl: result?.persona?.avatar_url || '',
          avatarEmoji: result?.persona?.avatar_emoji || undefined,
          prompt: result?.persona?.prompt || '',
        },
        selectedByAuto: Boolean(autoSelection),
        autoSelectedPersonaId,
        autoSelectedPersonaName,
      };

      setMessages(prev => ([...(prev || []), modelResponse]));
      setAttachments([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Message Failed', description: error.message });
      const errorResponse: ChatMessageProps = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `<p>Sorry, there was an error. Please try again.</p>`,
      };
    setMessages(prev => ([...(prev || []), errorResponse]));
    } finally {
      setIsSending(false);
    }
  };
  
  const handleSuggestionClick = useCallback((prompt: string) => {
    if (prompt.includes('[Paste text here]')) {
        setInput(prompt.replace('[Paste text here]', ''));
    } else {
        handleSendMessage({} as FormEvent, prompt);
    }
  }, [handleSendMessage, setInput]);

  // Rotate placeholder text every 4 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % suggestedPrompts.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
  <div className="w-full max-w-4xl mx-auto bg-background rounded-t-lg rounded-b-3xl border shadow-xl flex flex-col h-[70vh] min-h-[500px]">
    <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
      <h2 className="text-xl font-bold flex items-center">
        <Sparkles className="h-6 w-6 mr-2 text-primary" />
        Try the Personas — Meet your AI Co‑Pilots
      </h2>
      <p className="text-sm text-muted-foreground font-medium mt-1">
        Each persona is a tuned study companion with a distinct teaching style, tone, and expertise — try them to see which one adapts to your learning.
      </p>
    </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-0">
            {messages.map((msg) => {
              const msgPersonaId = msg.personaId ?? msg.persona?.id ?? selectedPersonaId;
              const msgPersonaName = msg.selectedByAuto
                ? (msg.autoSelectedPersonaName ?? msg.persona?.name ?? selectedPersona?.name)
                : (msg.persona?.name ?? selectedPersona?.name);

              return (
                <Message
                  key={msg.id}
                  message={msg}
                  personaId={msgPersonaId}
                  personaName={msgPersonaName}
                />
              );
            })}
            <AnimatePresence>
                {isSending && <ThinkingIndicator personaName={selectedPersona?.name || 'AI Assistant'} personaId={selectedPersonaId} />}
            </AnimatePresence>
            <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t bg-background/50">
      {/* Suggestions moved into the input placeholder as ghost text */}

            {/* Attachment Display Section - matches MultimodalInput.tsx */}
            <AnimatePresence>
                {attachments.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: '0.75rem' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="w-full"
                  >
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
                      <p className="text-xs font-medium text-foreground/60 uppercase tracking-wide">Attachments ({attachments.length})</p>
                      <div className="flex flex-wrap gap-3">
                        {attachments.map((attachment) => {
                          const attachmentKey = attachment.remoteUrl ?? attachment.url;
                          const isImage = attachment.contentType.startsWith('image/');
                          return (
                            <div 
                              key={attachmentKey} 
                              className="group relative"
                            >
                              {isImage ? (
                                <div className="relative w-20 h-20 rounded-md border border-border/60 overflow-hidden bg-muted hover:border-border/80 transition-colors">
                                  <img
                                    src={attachment.url}
                                    alt={attachment.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const parent = e.currentTarget.parentElement;
                                      if (parent) {
                                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-muted/50"><svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                                      }
                                    }}
                                  />
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => handleRemoveAttachment(attachment)}
                                          className="absolute top-1 right-1 h-6 w-6 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                                        >
                                          <XIcon className="w-3.5 h-3.5" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">Remove</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-black/10" />
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 rounded-md bg-background border border-border/60 py-2 px-3 text-sm hover:border-border/80 transition-colors h-20 w-auto">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-foreground/80 truncate">{attachment.name}</p>
                                      <p className="text-xs text-foreground/40">
                                        {(attachment.size / 1024).toFixed(1)} KB
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleRemoveAttachment(attachment)}
                                    className="h-6 w-6 flex-shrink-0 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <XIcon className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>

            {/* Input Form - inspired by MultimodalInput.tsx and Gemini */}
          <TooltipProvider>
                <form onSubmit={handleSendMessage} className="relative flex items-end gap-3 rounded-3xl border border-border/60 bg-card/50 backdrop-blur-sm px-1.5 py-1.5 shadow-sm hover:border-border/80 focus-within:border-primary/40 focus-within:shadow-md focus-within:hover:border-primary/40 transition-all duration-200">
                
                <div className="flex items-center gap-1 pl-2">
                  <PersonaSelector
                    personas={personas}
                    selectedPersonaId={selectedPersonaId}
                    onSelect={setSelectedPersonaId}
                    className="h-8 w-8 rounded-full text-foreground/60 hover:text-foreground hover:bg-muted/60 transition-all duration-200"
                    disabled={isLoading}
                  />

                  {isUploading ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-foreground/60"
                          disabled={true}
                          aria-label="Uploading file..."
                        >
                          <LoaderIcon className="h-4 w-4 animate-spin" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Uploading...</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 cursor-pointer rounded-full text-foreground/60 hover:text-foreground hover:bg-muted/60 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/50"
                          onClick={() => {
                            console.log('[LandingPageChat] Paperclip button clicked, triggering file input.');
                            fileInputRef.current?.click();
                          }}
                          aria-label="Attach file"
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Attach file</TooltipContent>
                    </Tooltip>
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
                  multiple
                />
                
                <div className="relative flex-1">
                  {/* Animated ghost suggestion overlay (smooth crossfade between prompts) */}
                  <AnimatePresence mode="wait">
                    {(!input && !isSending && !limitReached) && (
                      <motion.span
                        key={placeholderIndex}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 6 }}
                        transition={{ duration: 0.28, ease: 'easeInOut' }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[15px] leading-6 text-foreground/40"
                      >
                        Try: "{suggestedPrompts[placeholderIndex]}"
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={''}
                    className="flex-1 w-full px-2 py-2 bg-transparent text-[15px] leading-6 text-foreground placeholder:text-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 font-normal outline-none"
                    disabled={isSending || limitReached}
                    onKeyDown={(event) => {
                      if (
                        event.key === 'Enter' &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        handleSendMessage(event);
                      }
                    }}
                  />
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      disabled={isSending || (!input.trim() && attachments.length === 0) || limitReached}
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted/50 disabled:text-muted-foreground transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 shadow-sm hover:shadow-md"
                      aria-label={isSending ? "Generating response..." : "Send message"}
                    >
                      {isSending ? (
                        <LoaderIcon className="h-4.5 w-4.5 animate-spin" />
                      ) : (
                        <Send className="h-4.5 w-4.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {isSending ? 'Generating...' : 'Send (Enter)'}
                  </TooltipContent>
                </Tooltip>
              </form>
            </TooltipProvider>
        </div>
    </div>
  );
}