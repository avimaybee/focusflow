'use server';
/**
 * @fileOverview AI flow for adding citations to text.
 *
 * - addCitations - A function that adds citations.
 * - AddCitationsInput - The input type for the function.
 * - AddCitationsOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PersonaSchema } from './chat-types';

const AddCitationsInputSchema = z.object({
  textToCite: z.string().describe('The text that needs citations.'),
  citationStyle: z.enum(['APA', 'MLA', 'Chicago']).describe('The desired citation style.'),
  contextualSources: z.array(z.string()).optional().describe('An optional list of source identifiers or text to use for citations.'),
  persona: PersonaSchema.optional().describe('The AI persona to adopt when adding citations.'),
});
export type AddCitationsInput = z.infer<typeof AddCitationsInputSchema>;

const AddCitationsOutputSchema = z.object({
  citedText: z.string().describe('The text with citations added.'),
});
export type AddCitationsOutput = z.infer<typeof AddCitationsOutputSchema>;

export async function addCitations(
  input: AddCitationsInput
): Promise<AddCitationsOutput> {
  return addCitationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'addCitationsPrompt',
  input: {schema: AddCitationsInputSchema},
  output: {schema: AddCitationsOutputSchema},
  prompt: `You are an expert academic assistant specializing in citations. Your task is to add citations to the provided text in the specified style.

{{#if persona}}
You must adopt the persona of a {{persona}} when adding the citations.
{{/if}}

Citation Style: {{{citationStyle}}}

{{#if contextualSources}}
If specific sources are provided below, use them as references. Otherwise, use standard placeholders.
Sources:
---
{{#each contextualSources}}
- {{{this}}}
{{/each}}
---
{{/if}}

Text to Cite:
---
{{{textToCite}}}
---

Please provide only the text with the citations added in your response.
`,
});

const addCitationsFlow = ai.defineFlow(
  {
    name: 'addCitationsFlow',
    inputSchema: AddCitationsInputSchema,
    outputSchema: AddCitationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
