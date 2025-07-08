'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, MessageSquare, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleGeneratePrompts } from '@/app/summaries/[slug]/actions';
import type { CreateDiscussionPromptsOutput } from '@/ai/flows/create-discussion-prompts';

const groupPromptsByType = (prompts: CreateDiscussionPromptsOutput['prompts']) => {
  return prompts.reduce((acc, prompt) => {
    const key = prompt.type.endsWith('s') ? prompt.type : `${prompt.type}s`;
    (acc[key] = acc[key] || []).push(prompt);
    return acc;
  }, {} as Record<string, typeof prompts>);
};

export function DiscussionPromptsGenerator({ summaryText }: { summaryText: string }) {
  const [prompts, setPrompts] = useState<CreateDiscussionPromptsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const onGenerate = async () => {
    setIsLoading(true);
    setPrompts(null);
    const result = await handleGeneratePrompts({ sourceText: summaryText });
    if (result && result.prompts.length > 0) {
      setPrompts(result);
    } else {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate discussion prompts. Please try again.',
      });
    }
    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to Clipboard!' });
  };

  const groupedPrompts = prompts ? groupPromptsByType(prompts.prompts) : {};

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-3">
          <MessageSquare className="h-6 w-6" />
          Study Group Discussion Starters
        </CardTitle>
        <CardDescription>
          Generate AI-powered questions and scenarios to kickstart your group discussions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!prompts && !isLoading && (
          <Button onClick={onGenerate} disabled={isLoading}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Discussion Prompts
          </Button>
        )}
        
        {isLoading && (
            <Button disabled={true}>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Crafting discussion points...
            </Button>
        )}

        {prompts && (
          <div className="space-y-6 animate-in fade-in-50 duration-500">
            {Object.entries(groupedPrompts).map(([type, items]) => (
              <div key={type}>
                <h4 className="font-headline text-lg mb-2">{type}</h4>
                <ul className="space-y-3">
                  {items.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                      <p className="flex-grow text-muted-foreground">{item.text}</p>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => copyToClipboard(item.text)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
