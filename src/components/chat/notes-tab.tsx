'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useAuth } from '@/context/auth-context';
import { useContextHubStore } from '@/stores/use-context-hub-store';
import { getNotes, saveNotes } from '@/lib/notes-actions';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function NotesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { notesContent, setNotesContent } = useContextHubStore();
  
  const [initialContent, setInitialContent] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const [debouncedContent] = useDebounce(notesContent, 2000);

  useEffect(() => {
    if (user && !isLoaded) {
      getNotes(user.uid).then((content) => {
        setNotesContent(content);
        setInitialContent(content);
        setIsLoaded(true);
      });
    }
  }, [user, isLoaded, setNotesContent]);

  useEffect(() => {
    if (!isLoaded || !user || debouncedContent === initialContent) {
      return;
    }

    setSaveStatus('saving');
    saveNotes(user.uid, debouncedContent)
      .then(() => {
        setSaveStatus('saved');
        setInitialContent(debouncedContent);
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
  }, [debouncedContent, user, isLoaded, initialContent, toast]);

  const SaveStatusIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>;
      case 'saved':
        return <><CheckCircle className="h-4 w-4 text-green-500" /> Saved</>;
      case 'error':
        return <><AlertTriangle className="h-4 w-4 text-destructive" /> Error</>;
      default:
        return null;
    }
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
      <Textarea
        placeholder="Start typing your notes here..."
        className="w-full flex-grow resize-none border-none focus-visible:ring-0 p-0 bg-transparent text-base"
        value={notesContent}
        onChange={(e) => setNotesContent(e.target.value)}
      />
      <div className="h-6 mt-2 text-xs text-muted-foreground flex items-center gap-2">
        <SaveStatusIndicator />
      </div>
    </div>
  );
}
