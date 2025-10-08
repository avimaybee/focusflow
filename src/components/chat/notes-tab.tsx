
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { useAuth } from '@/context/auth-context';
import { getNotes, saveNotes } from '@/lib/notes-actions';
import { Loader2, CheckCircle, AlertTriangle, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Fuse from 'fuse.js';
import { ScrollArea } from '@/components/ui/scroll-area';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function NotesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [debouncedContent] = useDebounce(content, 1500);

  // Effect to fetch initial notes
  useEffect(() => {
    if (user && !isLoaded) {
      getNotes(user.id).then((initialContent) => {
        setContent(initialContent);
        setIsLoaded(true);
      });
    }
  }, [user, isLoaded]);

  // Effect to save notes when debounced content changes
  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    // Don't trigger save on initial load
    if (saveStatus === 'idle' && isLoaded && content === debouncedContent) {
        return;
    }

    setSaveStatus('saving');
    saveNotes(user.id, debouncedContent)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContent, user, isLoaded, toast]);
  
  const searchResults = useMemo(() => {
    if (!searchQuery) return null;
    // We need to search the text content, not the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    const fuse = new Fuse([textContent], { includeMatches: true, findAllMatches: true, threshold: 0.1 });
    const result = fuse.search(searchQuery);
    const matches = result.flatMap(r => r.matches);
    
    if (matches.length === 0) {
      return '<p class="text-muted-foreground">No matches found.</p>';
    }

    let highlightedContent = textContent;
    matches.sort((a,b) => b.indices[0][0] - a.indices[0][0]).forEach(match => {
      const [start, end] = match.indices[0];
      highlightedContent = `${highlightedContent.substring(0, start)}<mark class="bg-primary/50">${highlightedContent.substring(start, end + 1)}</mark>${highlightedContent.substring(end + 1)}`;
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