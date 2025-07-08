
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Loader2, Sparkles, BrainCircuit, Lightbulb, Trash2 } from 'lucide-react';
import {
  handleExplainConcept,
  handleSaveExplanation,
  getSavedExplanations,
  handleDeleteExplanation,
} from '@/app/my-content/explanations/actions';
import { useToast } from '@/hooks/use-toast';
import type { ExplainConceptOutput, SavedExplanation } from '@/app/my-content/explanations/actions';
import { useAuth } from './auth-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';

type Selection = {
  text: string;
  top: number;
  left: number;
  context: string;
};

interface ExplanationContextType {}

const ExplanationContext = createContext<ExplanationContextType | undefined>(undefined);

export const ExplanationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [explanation, setExplanation] = useState<ExplainConceptOutput | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [showExplanationSheet, setShowExplanationSheet] = useState(false);
  
  const [savedExplanations, setSavedExplanations] = useState<SavedExplanation[]>([]);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setIsLoadingSaved(true);
      getSavedExplanations(user.uid)
        .then(setSavedExplanations)
        .finally(() => setIsLoadingSaved(false));
    } else {
      setSavedExplanations([]);
      setIsLoadingSaved(false);
    }
  }, [user]);

  const handleMouseUp = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-explain-button]')) {
      return;
    }

    const currentSelection = window.getSelection();
    const selectedText = currentSelection?.toString().trim();
    
    if (selectedText && currentSelection && currentSelection.rangeCount > 0) {
      const range = currentSelection.getRangeAt(0);
      const container = (range.commonAncestorContainer.parentElement as HTMLElement)?.closest('[data-explainable="true"]');

      if (container) {
        const rect = range.getBoundingClientRect();
        
        setSelection({
          text: selectedText,
          top: rect.top + rect.height + window.scrollY,
          left: rect.left + rect.width / 2 + window.scrollX,
          context: container.textContent || '',
        });
        return;
      }
    }
    setSelection(null);
  };
  
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleExplainClick = async () => {
    if (!selection) return;
    setIsExplaining(true);
    setExplanation(null);
    setShowExplanationSheet(true);
    
    const textToExplain = selection.text;
    const fullContext = selection.context;
    setSelection(null);

    const explanationResult = await handleExplainConcept({
        highlightedText: textToExplain,
        fullContextText: fullContext,
    });

    if (explanationResult) {
        setExplanation(explanationResult);
        if (user) {
            const savedItem = await handleSaveExplanation(user.uid, {
                highlightedText: textToExplain,
                explanation: explanationResult.explanation,
                example: explanationResult.example
            });
            if (savedItem) {
                setSavedExplanations(prev => [savedItem, ...prev]);
            }
        }
    } else {
        toast({
            variant: "destructive",
            title: "Explanation Failed",
            description: "Could not explain the selected concept. Please try again.",
        });
        setShowExplanationSheet(false);
    }
    setIsExplaining(false);
  }

  const onDeleteFromSidePanel = async (e: React.MouseEvent, explanationId: string) => {
    e.stopPropagation();
    if (!user) return;
    
    // Optimistic UI update
    const originalExplanations = [...savedExplanations];
    setSavedExplanations(prev => prev.filter(item => item.id !== explanationId));

    const result = await handleDeleteExplanation(user.uid, explanationId);
    if (!result.success) {
      // Revert if delete fails
      setSavedExplanations(originalExplanations);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete explanation.' });
    } else {
      toast({ title: 'Deleted!', description: 'Explanation removed from your notes.' });
    }
  }

  return (
    <ExplanationContext.Provider value={{}}>
        <div>
            {children}

            {user && (
                <Button
                    variant="secondary"
                    className="fixed right-0 top-1/2 -translate-y-1/2 z-40 rounded-r-none h-12 shadow-lg"
                    onClick={() => setIsSidePanelOpen(true)}
                    aria-label="Open my explanations"
                >
                    <Lightbulb className="h-6 w-6" />
                </Button>
            )}

            {selection && (
                <Button
                    data-explain-button
                    style={{ top: `${selection.top}px`, left: `${selection.left}px` }}
                    className="absolute mt-2 z-50 -translate-x-1/2"
                    size="sm"
                    onClick={handleExplainClick}
                >
                    <Sparkles className="mr-2 h-4 w-4" /> Explain
                </Button>
            )}

            <Sheet open={showExplanationSheet} onOpenChange={setShowExplanationSheet}>
                <SheetContent className="sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2 font-headline">
                            <BrainCircuit className="h-6 w-6 text-primary" />
                            Concept Explanation
                        </SheetTitle>
                    </SheetHeader>
                    <div className="py-4 space-y-6">
                        {isExplaining && (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-10">
                                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                <p>Thinking...</p>
                            </div>
                        )}
                        {explanation && (
                            <div className="space-y-4 animate-in fade-in-50 duration-500">
                                <div>
                                    <h3 className="font-headline text-lg mb-2">Explanation</h3>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{explanation.explanation}</p>
                                </div>
                                <div>
                                    <h3 className="font-headline text-lg mb-2">Example</h3>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{explanation.example}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <Sheet open={isSidePanelOpen} onOpenChange={setIsSidePanelOpen}>
                <SheetContent className="sm:max-w-md w-full flex flex-col">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2 font-headline">
                           <Lightbulb className="h-6 w-6 text-primary"/> My Concept Notes
                        </SheetTitle>
                        <SheetDescription>
                            Your saved explanations for quick reference.
                        </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="flex-grow my-4">
                        {isLoadingSaved ? (
                             <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-10">
                                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                            </div>
                        ) : savedExplanations.length > 0 ? (
                             <Accordion type="single" collapsible className="w-full">
                                {savedExplanations.map(item => (
                                    <AccordionItem value={item.id} key={item.id}>
                                        <div className="flex items-center justify-between">
                                            <AccordionTrigger className="flex-1 text-left py-3 pr-2">{item.highlightedText}</AccordionTrigger>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => onDeleteFromSidePanel(e, item.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        </div>
                                        <AccordionContent className="space-y-3 pb-4">
                                            <div>
                                                <h4 className='font-semibold text-sm mb-1'>Explanation</h4>
                                                <p className="text-sm text-muted-foreground">{item.explanation}</p>
                                            </div>
                                            <div>
                                                <h4 className='font-semibold text-sm mb-1'>Example</h4>
                                                <p className="text-sm text-muted-foreground">{item.example}</p>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <div className="text-center text-muted-foreground pt-10">
                                <p>You haven't saved any explanations yet.</p>
                                <p className="text-sm">Highlight text in a summary to start building your notes.</p>
                            </div>
                        )}
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
    </ExplanationContext.Provider>
  );
};

export const useExplanation = () => {
  const context = useContext(ExplanationContext);
  if (context === undefined) {
    throw new Error('useExplanation must be used within an ExplanationProvider');
  }
  return context;
};
