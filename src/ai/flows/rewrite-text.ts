'use server';
/**
 * @fileOverview AI flow for rewriting text with a specified style.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PersonaSchema } from './chat-types';

const RewriteTextInputSchema = z.object({
  textToRewrite: z.string().describe('The text to be rewritten.'),
  style: z.string().describe('The desired style for the rewritten text (e.g., "clearer and more concise", "more formal", "like a story").'),
  persona: PersonaSchema.optional().describe('The AI persona to adopt when rewriting.'),
});
export type RewriteTextInput = z.infer<typeof RewriteTextInputSchema>;

const RewriteTextOutputSchema = z.object({
  rewrittenText: z.string().describe('The rewritten text.'),
});
export type RewriteTextOutput = z.infer<typeof RewriteTextOutputSchema>;

const prompt = ai.definePrompt({
  name: 'rewriteTextPrompt',
  input: {schema: RewriteTextInputSchema},
  output: {schema: RewriteTextOutputSchema},
  prompt: `You are an expert editor. Your task is to rewrite the provided text to be {style}.

{{#if persona}}
You must adopt the persona of a {{persona}} when rewriting the text.
{{/if}}

Original Text:
---
{{{textToRewrite}}}
---

Please provide only the rewritten text in your response.
`,
});

export const rewriteTextFlow = ai.defineFlow(
  {
    name: 'rewriteTextFlow',
    inputSchema: RewriteTextInputSchema,
    outputSchema: RewriteTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);