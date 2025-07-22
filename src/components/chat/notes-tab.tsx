
'use client';

import { useEffect, useState, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { useAuth } from '@/context/auth-context';
import { getNotes, saveNotes } from '@/lib/notes-actions';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle, Bold, Italic, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type FormatType = 'bold' | 'italic' | 'list';

export function NotesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [debouncedContent] = useDebounce(content, 1500);

  // Effect to fetch initial notes
  useEffect(() => {
    if (user && !isLoaded) {
      getNotes(user.uid).then((initialContent) => {
        setContent(initialContent);
        setIsLoaded(true);
      });
    }
  }, [user, isLoaded]);

  // Effect to save notes when debounced content changes
  useEffect(() => {
    // Do not save initial content fetched from DB
    if (!isLoaded || !user) {
      return;
    }

    setSaveStatus('saving');
    saveNotes(user.uid, debouncedContent)
      .then(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      })
      .catch(() => {
        setSaveStatus('error');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save your notes. Please try again.',
        });
        setTimeout(() => setSaveStatus('idle'), 2000);
      });
  }, [debouncedContent, user, isLoaded, toast]);

  const handleFormat = (type: FormatType) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let newText = '';

    if (type === 'bold') {
      newText = `**${selectedText}**`;
    } else if (type === 'italic') {
      newText = `*${selectedText}*`;
    } else if (type === 'list') {
      newText = `- ${selectedText}`;
    }

    const updatedContent = `${content.substring(0, start)}${newText}${content.substring(end)}`;
    setContent(updatedContent);

    // Focus and adjust cursor position after formatting
    setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + newText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const SaveStatusIndicator = () => {
    if (saveStatus === 'idle') return null;
    
    const messages = {
        saving: <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>,
        saved: <><CheckCircle className="h-4 w-4 text-green-500" /> Saved</>,
        error: <><AlertTriangle className="h-4 w-4 text-destructive" /> Error</>
    };

    return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {messages[saveStatus]}
        </div>
    );
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">My Notes</h3>
        <div className="h-6">
            <SaveStatusIndicator />
        </div>
      </div>
      <div className="flex items-center gap-1 p-1 mb-2 border rounded-md bg-secondary/80">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFormat('bold')}>
                        <Bold className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Bold</p></TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFormat('italic')}>
                        <Italic className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Italic</p></TooltipContent>
            </Tooltip>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFormat('list')}>
                        <List className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Bulleted List</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>
      <Textarea
        ref={textareaRef}
        placeholder="Start typing your notes here... they will be saved automatically."
        className="w-full flex-grow resize-none border rounded-md p-2 bg-transparent text-base focus-visible:ring-1"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
    </div>
  );
}
