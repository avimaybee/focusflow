'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { handleSummarize } from './actions';
import { Loader2, Copy, Download, Share2, Sparkles, FileText, Upload, X, Paperclip, BookCopy, ClipboardCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const summarizerSchema = z.object({
  notes: z.string(), // Validation is handled in onSubmit
});

type SummarizerFormValues = z.infer<typeof summarizerSchema>;

type SummaryResult = {
  summary: string;
  keywords: string;
};

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export default function SummarizerPage() {
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lastSuccessfulInput, setLastSuccessfulInput] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<SummarizerFormValues>({
    resolver: zodResolver(summarizerSchema),
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

  const onSubmit = async (data: SummarizerFormValues) => {
    setIsLoading(true);
    setResult(null);
    setLastSuccessfulInput(null);

    let notesInput: string;

    try {
      if (selectedFile) {
        notesInput = await fileToDataUri(selectedFile);
      } else {
        if (data.notes.length < 50) {
          form.setError('notes', {
            type: 'manual',
            message: 'Please enter at least 50 characters to summarize.',
          });
          setIsLoading(false);
          return;
        }
        notesInput = data.notes;
      }

      const summaryResult = await handleSummarize({ notes: notesInput });
      if (summaryResult) {
        setResult(summaryResult);
        setLastSuccessfulInput(notesInput);
      } else {
        toast({
          variant: 'destructive',
          title: 'Summarization Failed',
          description: 'An error occurred while summarizing your notes. Please try again.',
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

  const handleNextStepClick = () => {
    if (lastSuccessfulInput) {
      sessionStorage.setItem('focusflow-notes-for-next-step', lastSuccessfulInput);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to Clipboard!',
      description: 'The summary has been copied to your clipboard.',
    });
  };

  const downloadSummary = (text: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'summary.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="text-center mb-12">
        <Sparkles className="mx-auto h-12 w-12 text-primary" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold mt-4">AI Note Summarizer</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Transform lengthy notes or PDFs into concise summaries instantly.
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
                      Summarizing...
                    </>
                  ) : (
                    'Summarize Notes'
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
                <Sparkles className="h-6 w-6 text-accent" /> AI Generated Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[300px]">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Generating your summary...</p>
                </div>
              )}
              {result && (
                <div className="space-y-6 animate-in fade-in-50 duration-500">
                  <div>
                    <h3 className="font-headline text-lg mb-2">Summary</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{result.summary}</p>
                  </div>
                  <div>
                    <h3 className="font-headline text-lg mb-2">Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.keywords.split(',').map((keyword) => (
                        <Badge key={keyword.trim()} variant="secondary">{keyword.trim()}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(result.summary)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => downloadSummary(result.summary)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-headline text-md mb-2">Next Steps</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Now that you have your summary, take your learning to the next level.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/flashcards" onClick={handleNextStepClick}>
                          <BookCopy className="mr-2" /> Create Flashcards
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/quiz" onClick={handleNextStepClick}>
                          <ClipboardCheck className="mr-2" /> Take a Practice Quiz
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {!isLoading && !result && (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                  <p>Your summary will appear here once generated.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
