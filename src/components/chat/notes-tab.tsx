'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useAuth } from '@/context/auth-context';
import { getNotes, saveNotes } from '@/lib/notes-actions';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function NotesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">My Notes</h3>
        <div className="h-6">
            <SaveStatusIndicator />
        </div>
      </div>
      <Textarea
        placeholder="Start typing your notes here... they will be saved automatically."
        className="w-full flex-grow resize-none border rounded-md p-2 bg-transparent text-base focus-visible:ring-1"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
    </div>
  );
}