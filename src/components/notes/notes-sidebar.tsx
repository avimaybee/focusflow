
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import { useAuth } from '@/context/auth-context';
import { useNotesStore } from '@/stores/use-notes-store';
import { getNotes, saveNotes } from '@/lib/notes-actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function NotesSidebar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isNotesOpen, notesContent, setNotesContent, toggleNotes } = useNotesStore();
  
  const [initialContent, setInitialContent] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const [debouncedContent] = useDebounce(notesContent, 2000); // 2-second debounce

  // Fetch initial notes content when the sidebar opens
  useEffect(() => {
    if (isNotesOpen && user && !isLoaded) {
      getNotes(user.uid).then((content) => {
        setNotesContent(content);
        setInitialContent(content); // Set the initial content to prevent saving on load
        setIsLoaded(true);
      });
    }
  }, [isNotesOpen, user, isLoaded, setNotesContent]);

  // Autosave debounced content
  useEffect(() => {
    // Conditions to prevent saving:
    // 1. Not loaded yet
    // 2. User is not logged in
    // 3. The content is the same as the initial content fetched from the server
    if (!isLoaded || !user || debouncedContent === initialContent) {
      return;
    }

    setSaveStatus('saving');
    saveNotes(user.uid, debouncedContent)
      .then(() => {
        setSaveStatus('saved');
        // After saving, the new debounced content becomes the "initial" content for the next comparison
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContent, user, isLoaded]);

  const sidebarVariants = {
    closed: { x: '100%' },
    open: { x: 0 },
  };

  const SaveStatusIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>;
      case 'saved':
        return <><CheckCircle className="h-4 w-4 text-green-500" /> Saved</>;
      case 'error':
        return <><AlertTriangle className="h-4 w-4 text-destructive" /> Save Error</>;
      default:
        return <span>Notes</span>;
    }
  };

  return (
    <AnimatePresence>
      {isNotesOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-30 bg-black/50"
            onClick={toggleNotes}
          />
          <motion.div
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background z-40 flex flex-col border-l border-border"
          >
            <header className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <SaveStatusIndicator />
              </h3>
              <Button variant="ghost" size="icon" onClick={toggleNotes}>
                <X className="h-5 w-5" />
              </Button>
            </header>
            <div className="flex-1 p-4">
              {!isLoaded ? (
                 <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
              ) : (
                <Textarea
                  placeholder="Start typing your notes here..."
                  className="w-full h-full resize-none border-none focus-visible:ring-0 p-0 bg-transparent text-base"
                  value={notesContent}
                  onChange={(e) => setNotesContent(e.target.value)}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
