
'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { useAuth } from '@/context/auth-context';
import { useNotesStore } from '@/stores/use-notes-store';
import { Loader2, CheckCircle, AlertTriangle, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Fuse from 'fuse.js';
import { ScrollArea } from '@/components/ui/scroll-area';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function NotesTab() {
  const { user, session } = useAuth();
  const { refreshTrigger } = useNotesStore();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const hasLoadedRef = useRef(false);
  
  const [debouncedContent] = useDebounce(content, 1500);

  // Effect to fetch initial notes
  useEffect(() => {
    async function loadNotes() {
      if (!user || !session?.access_token) return;

      try {
        const response = await fetch(`/api/notes?userId=${user.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setContent(data.content || '');
        } else {
          console.error('Failed to load notes:', response.status);
        }
      } catch (err) {
        console.error('Error loading notes:', err);
      } finally {
        setIsLoaded(true);
      }
    }

    loadNotes();
  }, [user, session, refreshTrigger]);

  // Effect to save notes when debounced content changes
  useEffect(() => {
    let timeoutId: number | null = null;

    async function saveNotesToServer() {
      if (!isLoaded || !user || !session?.access_token) {
        return;
      }

      // Don't trigger save on initial load (first time debouncedContent updates after loading)
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        return;
      }

      setSaveStatus('saving');
      
      try {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId: user.id, content: debouncedContent }),
        });

        if (response.ok) {
          setSaveStatus('saved');
          timeoutId = window.setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          throw new Error('Failed to save notes');
        }
      } catch (err) {
        console.error('Error saving notes:', err);
        setSaveStatus('error');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save your notes. Please try again.',
        });
        timeoutId = window.setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }

    saveNotesToServer();

    // Cleanup function to clear timeout if component unmounts
    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContent, user, session, isLoaded, toast]);
  
  const searchResults = useMemo(() => {
    if (!searchQuery) return null;
    // We need to search the text content, not the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    const fuse = new Fuse([textContent], { includeMatches: true, findAllMatches: true, threshold: 0.1 });
    const result = fuse.search(searchQuery);
    const matches = result.flatMap(r => r.matches || []);
    
    if (matches.length === 0) {
      return '<p class="text-muted-foreground">No matches found.</p>';
    }

    let highlightedContent = textContent;
    matches
      .filter((match): match is NonNullable<typeof match> => match !== undefined && match !== null)
      .sort((a, b) => (b.indices?.[0]?.[0] ?? 0) - (a.indices?.[0]?.[0] ?? 0))
      .forEach(match => {
        const indices = match.indices?.[0];
        if (indices && Array.isArray(indices) && indices.length >= 2) {
          const [start, end] = indices;
          highlightedContent = `${highlightedContent.substring(0, start)}<mark class="bg-primary/50">${highlightedContent.substring(start, end + 1)}</mark>${highlightedContent.substring(end + 1)}`;
        }
      });
    
    return highlightedContent.replace(/\n/g, '<br />');

  }, [searchQuery, content]);

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
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">My Notes</h3>
        <div className="h-6">
            <SaveStatusIndicator />
        </div>
      </div>

       <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search notes..."
            className="pl-10 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchQuery('')}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

      <div className="flex-grow rounded-md border border-input bg-transparent focus-visible:ring-1 overflow-hidden">
        {searchResults ? (
          <ScrollArea className="h-full">
            <div
              className="prose dark:prose-invert prose-sm max-w-full p-3 focus:outline-none"
              dangerouslySetInnerHTML={{ __html: searchResults }}
            />
          </ScrollArea>
        ) : (
          <RichTextEditor
              content={content}
              onChange={(newContent) => {
                  setContent(newContent);
                  setSaveStatus('saving');
              }}
              placeholder="Start typing your notes here..."
          />
        )}
      </div>
    </div>
  );
}