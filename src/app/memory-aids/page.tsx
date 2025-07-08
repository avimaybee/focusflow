'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { handleCreateMemoryAid } from './actions';
import { CreateMemoryAidOutput } from '@/ai/flows/create-memory-aid';
import {
  Loader2,
  Sparkles,
  Puzzle,
  Lightbulb,
  Copy,
  Star,
  ClipboardCheck,
  CaseSensitive,
  Music,
  BookText,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const memoryAidSchema = z.object({
  concept: z.string().min(3, 'Please enter a concept with at least 3 characters.'),
});

type MemoryAidFormValues = z.infer<typeof memoryAidSchema>;

const AidCard = ({ title, content, icon }: { title: string; content: string | undefined; icon: React.ReactNode }) => {
    const { toast } = useToast();
    if (!content) return null;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(content);
        toast({
          title: 'Copied to Clipboard!',
          description: `${title} has been copied.`,
        });
    }

    return (
        <Card className="bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    {icon} {title}
                </CardTitle>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyToClipboard}>
                        <Copy className="h-4 w-4" />
                    </Button>
                    {/* Favorite button placeholder */}
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
                        <Star className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{content}</p>
            </CardContent>
        </Card>
    );
}

export default function MemoryAidsPage() {
  const [result, setResult] = useState<CreateMemoryAidOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<MemoryAidFormValues>({
    resolver: zodResolver(memoryAidSchema),
    defaultValues: { concept: '' },
  });

  const onSubmit = async (data: MemoryAidFormValues) => {
    setIsLoading(true);
    setResult(null);

    const response = await handleCreateMemoryAid({ concept: data.concept });
    if (response.data) {
        setResult(response.data);
    } else {
        toast({
            variant: 'destructive',
            title: 'Generation Failed',
            description: response.error || 'Could not generate memory aids. Please try again.',
        });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="text-center mb-12">
        <Puzzle className="mx-auto h-12 w-12 text-primary" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold mt-4">AI Memory Aid Generator</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Turn complex concepts into simple, memorable phrases and stories.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <ClipboardCheck className="h-6 w-6" /> Your Concept
            </CardTitle>
            <CardDescription>Enter the term, list, or idea you want to memorize.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="concept"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Concept to Memorize</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., The planets in order from the sun, the Krebs cycle, the definition of 'mitosis'..."
                          className="min-h-[150px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Memory Aids
                    </>
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
                <Lightbulb className="h-6 w-6 text-accent" /> Your Memory Aids
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[300px] flex flex-col">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Thinking of creative acronyms and rhymes...</p>
                </div>
              )}
              {result && (
                 <div className="space-y-4 animate-in fade-in-50 duration-500">
                    <AidCard title="Acronym" content={result.acronym} icon={<CaseSensitive className="h-5 w-5" />} />
                    <AidCard title="Rhyme / Jingle" content={result.rhyme} icon={<Music className="h-5 w-5" />} />
                    <AidCard title="Story" content={result.story} icon={<BookText className="h-5 w-5" />} />
                    <AidCard title="Visual Imagery" content={result.imagery} icon={<Eye className="h-5 w-5" />} />
                 </div>
              )}
              {!isLoading && !result && (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                  <p>Your creative memory aids will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
