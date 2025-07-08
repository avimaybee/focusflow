
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2, Sparkles, BrainCircuit } from 'lucide-react';
import { handleExplainConcept } from '@/app/summarizer/actions';
import { useToast } from '@/hooks/use-toast';
import type { ExplainConceptOutput } from '@/ai/flows/explain-concept';

type Selection = {
  text: string;
  top: number;
  left: number;
  context: string;
};

interface ExplanationContextType {}

const ExplanationContext = createContext<ExplanationContextType | undefined>(undefined);

export const ExplanationProvider = ({ children }: { children: ReactNode }) => {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [explanation, setExplanation] = useState<ExplainConceptOutput | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [showExplanationSheet, setShowExplanationSheet] = useState(false);
  const { toast } = useToast();

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

  return (
    <ExplanationContext.Provider value={{}}>
        <div>
            {children}

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
