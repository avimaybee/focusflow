'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { handleCreateFlashcards } from './actions';
import {
  Loader2,
  Copy,
  Download,
  Share2,
  Sparkles,
  FileText,
  Upload,
  X,
  Paperclip,
  BookCopy,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';


const flashcardSchema = z.object({
  notes: z.string(), // Validation is handled in onSubmit
});

type FlashcardFormValues = z.infer<typeof flashcardSchema>;

type Flashcard = {
  question: string;
  answer: string;
};

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<FlashcardFormValues>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: {
      notes: '',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a PDF file.',
        });
        return;
      }
      setSelectedFile(file);
      form.setValue('notes', file.name); // Use file name to satisfy form state
      form.clearErrors('notes');
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    form.setValue('notes', '');
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const onSubmit = async (data: FlashcardFormValues) => {
    setIsLoading(true);
    setFlashcards(null);
    setCurrentCard(0);
    setIsFlipped(false);

    let notesInput: string;

    try {
      if (selectedFile) {
        notesInput = await fileToDataUri(selectedFile);
      } else {
        if (data.notes.length < 50) {
          form.setError('notes', {
            type: 'manual',
            message: 'Please enter at least 50 characters to generate flashcards.',
          });
          setIsLoading(false);
          return;
        }
        notesInput = data.notes;
      }

      const result = await handleCreateFlashcards({ notes: notesInput });
      if (result && result.flashcards.length > 0) {
        setFlashcards(result.flashcards);
      } else {
        toast({
          variant: 'destructive',
          title: 'Flashcard Generation Failed',
          description: 'Could not generate flashcards from the provided text. Please try again with different content.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please check the console for details.',
      });
      console.error(error);
    }
    setIsLoading(false);
  };
  
  const copySetToClipboard = () => {
    if (!flashcards) return;
    const text = flashcards.map(card => `Q: ${card.question}\nA: ${card.answer}`).join('\n\n');
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to Clipboard!',
      description: 'The flashcard set has been copied.',
    });
  };

  const downloadSet = () => {
    if (!flashcards) return;
    const text = flashcards.map(card => `Q: ${card.question}\nA: ${card.answer}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flashcards.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const navigateCard = (direction: 'next' | 'prev') => {
    if (!flashcards) return;
    setIsFlipped(false);
    if (direction === 'next') {
      setCurrentCard((prev) => (prev + 1) % flashcards.length);
    } else {
      setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <style>{`
        .flashcard { perspective: 1000px; }
        .flashcard-inner { position: relative; width: 100%; height: 100%; text-align: center; transition: transform 0.6s; transform-style: preserve-3d; }
        .flashcard.flipped .flashcard-inner { transform: rotateY(180deg); }
        .flashcard-front, .flashcard-back { position: absolute; width: 100%; height: 100%; -webkit-backface-visibility: hidden; backface-visibility: hidden; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
        .flashcard-back { transform: rotateY(180deg); }
      `}</style>
      <div className="text-center mb-12">
        <BookCopy className="mx-auto h-12 w-12 text-primary" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold mt-4">AI Flashcard Generator</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Turn your notes into interactive flashcards in one click.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <FileText className="h-6 w-6" /> Your Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paste your text below or upload a PDF</FormLabel>
                       {selectedFile && (
                        <div className="flex items-center justify-between text-sm p-2 bg-muted rounded-md border">
                            <div className="flex items-center gap-2 truncate">
                                <Paperclip className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{selectedFile.name}</span>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={clearFile}>
                                <X className="h-4 w-4"/>
                            </Button>
                        </div>
                      )}
                      <FormControl>
                        <Textarea
                          placeholder="Type or paste your notes here..."
                          className="min-h-[300px] resize-y"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (selectedFile) setSelectedFile(null);
                          }}
                          disabled={!!selectedFile}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                  />
                 <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" /> Upload PDF
                </Button>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Create Flashcards'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="sticky top-24">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Sparkles className="h-6 w-6 text-accent" /> Your Flashcards
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[350px] flex flex-col">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Building your flashcard deck...</p>
                </div>
              )}
              {flashcards && flashcards.length > 0 && (
                <div className="flex flex-col flex-grow animate-in fade-in-50 duration-500">
                  <div className={cn("flashcard flex-grow", { 'flipped': isFlipped })}>
                    <div className="flashcard-inner rounded-lg border bg-card text-card-foreground shadow-sm">
                      <div className="flashcard-front">
                        <p className="text-xl font-medium text-center">{flashcards[currentCard].question}</p>
                      </div>
                      <div className="flashcard-back bg-muted">
                        <p className="text-lg text-center">{flashcards[currentCard].answer}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center items-center gap-4 mt-4">
                    <Button variant="outline" size="icon" onClick={() => navigateCard('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {currentCard + 1} / {flashcards.length}
                    </p>
                    <Button variant="outline" size="icon" onClick={() => navigateCard('next')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                   <Button variant="secondary" className="mt-4" onClick={() => setIsFlipped(!isFlipped)}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Flip Card
                    </Button>
                  <div className="flex gap-2 justify-end pt-4 mt-4 border-t">
                    <Button variant="ghost" size="icon" onClick={copySetToClipboard}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={downloadSet}>
                      <Download className="h-4 w-4" />
                    </Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Share2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-accent" />
                            Share Your Flashcards!
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This is a premium feature. Upgrade to get a shareable link for your flashcard sets and study with friends!
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Maybe Later</AlertDialogCancel>
                          <AlertDialogAction asChild>
                            <Link href="#">Go Premium</Link>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
              {!isLoading && !flashcards && (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                  <p>Your flashcards will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
