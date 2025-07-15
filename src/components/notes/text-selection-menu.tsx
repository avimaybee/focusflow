
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotesStore } from '@/stores/use-notes-store';
import { Button } from '@/components/ui/button';
import { NotebookPen, Sparkles, Loader2 } from 'lucide-react';
import { getExplanation } from '@/lib/ai-actions';
import { cn } from '@/lib/utils';

interface TextSelectionMenuProps {
  containerRef: React.RefObject<HTMLElement>;
}

type ExplanationState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  content: string | null;
};

export function TextSelectionMenu({ containerRef }: TextSelectionMenuProps) {
  const { appendToNotes, toggleNotes, isNotesOpen } = useNotesStore();
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [explanation, setExplanation] = useState<ExplanationState>({ status: 'idle', content: null });
  const menuRef = useRef<HTMLDivElement>(null);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setPosition(null);
    setSelectedText('');
    setExplanation({ status: 'idle', content: null });
  }, []);

  const handleSelection = useCallback(() => {
    if (explanation.status !== 'idle') {
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      if (position) clearSelection();
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      if (position) clearSelection();
      return;
    }

    const parentElement = selection.anchorNode?.parentElement;
    if (parentElement?.closest('pre, code, a')) {
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      setPosition({
        top: rect.top - containerRect.top - 45,
        left: rect.left - containerRect.left + rect.width / 2,
      });
      setSelectedText(text);
    }
  }, [containerRef, explanation.status, position, clearSelection]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        clearSelection();
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleSelection, clearSelection]);

  const handleExplain = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedText) return;
    setExplanation({ status: 'loading', content: null });
    const result = await getExplanation(selectedText);
    setExplanation({
      status: result.includes('text-destructive') ? 'error' : 'success',
      content: result,
    });
  };

  const handleSendToNotes = (e: React.MouseEvent) => {
    e.preventDefault();
    if (selectedText) {
      const contentToAppend = explanation.status === 'success'
        ? `> ${selectedText}\n\n${explanation.content?.replace(/<[^>]*>/g, '\n')}`
        : selectedText;
      appendToNotes(contentToAppend);
      if (!isNotesOpen) {
        toggleNotes();
      }
      clearSelection();
    }
  };

  return (
    <AnimatePresence>
      {position && selectedText && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute z-20"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className={cn(
            "p-1 rounded-lg bg-secondary border border-border",
            explanation.status !== 'idle' && 'w-80'
          )}>
            {explanation.status === 'idle' && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onMouseDown={handleExplain} className="h-8 px-2">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Explain
                </Button>
                <Button variant="ghost" size="sm" onMouseDown={handleSendToNotes} className="h-8 px-2">
                  <NotebookPen className="h-4 w-4 mr-2" />
                  Send to Notes
                </Button>
              </div>
            )}

            {explanation.status === 'loading' && (
              <div className="p-4 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {(explanation.status === 'success' || explanation.status === 'error') && (
              <div className="p-3 text-left">
                <div className="prose prose-sm dark:prose-invert max-h-60 overflow-y-auto" dangerouslySetInnerHTML={{ __html: explanation.content || '' }} />
                <div className="mt-2 pt-2 border-t border-border">
                  <Button variant="default" size="sm" onMouseDown={handleSendToNotes} className="w-full">
                    <NotebookPen className="h-4 w-4 mr-2" />
                    Add to Notes
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
