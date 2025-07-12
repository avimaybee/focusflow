'use server';
/**
 * @fileOverview AI flow for generating counterarguments to a statement.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PersonaSchema } from './chat-types';

const GenerateCounterargumentsInputSchema = z.object({
  statementToChallenge: z.string().describe('The statement to generate counterarguments for.'),
  persona: PersonaSchema.optional().describe('The AI persona to adopt.'),
});
export type GenerateCounterargumentsInput = z.infer<typeof GenerateCounterargumentsInputSchema>;

const GenerateCounterargumentsOutputSchema = z.object({
  counterarguments: z.array(z.string()).describe('An array of 3-5 well-reasoned counterarguments.'),
});
export type GenerateCounterargumentsOutput = z.infer<typeof GenerateCounterargumentsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateCounterargumentsPrompt',
  input: {schema: GenerateCounterargumentsInputSchema},
  output: {schema: GenerateCounterargumentsOutputSchema},
  prompt: `You are an expert critical thinker and debater. Your task is to analyze the following claim and produce 3-5 well-reasoned counterarguments.

{{#if persona}}
You must adopt the persona of a {{persona}} when generating the counterarguments.
{{/if}}

Statement to Challenge:
---
{{{statementToChallenge}}}
---

Please provide only the counterarguments in your response.
`,
});

export const generateCounterargumentsFlow = ai.defineFlow(
  {
    name: 'generateCounterargumentsFlow',
    inputSchema: GenerateCounterargumentsInputSchema,
    outputSchema: GenerateCounterargumentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);