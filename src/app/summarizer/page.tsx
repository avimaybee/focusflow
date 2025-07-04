'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { handleSummarize } from './actions';
import { Loader2, Copy, Download, Share2, Sparkles, FileText, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const summarizerSchema = z.object({
  notes: z.string().min(50, 'Please enter at least 50 characters to summarize.'),
});

type SummarizerFormValues = z.infer<typeof summarizerSchema>;

type SummaryResult = {
  summary: string;
  keywords: string;
};

export default function SummarizerPage() {
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SummarizerFormValues>({
    resolver: zodResolver(summarizerSchema),
    defaultValues: {
      notes: '',
    },
  });

  const onSubmit = async (data: SummarizerFormValues) => {
    setIsLoading(true);
    setResult(null);
    try {
      const summaryResult = await handleSummarize(data);
      if (summaryResult) {
        setResult(summaryResult);
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
          Transform lengthy notes into concise summaries instantly.
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paste your text below or</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Type or paste your notes here..."
                          className="min-h-[300px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <Button type="button" variant="outline" className="w-full" disabled>
                  <Upload className="mr-2 h-4 w-4" /> Upload PDF (Premium)
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
