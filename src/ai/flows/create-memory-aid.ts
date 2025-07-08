'use server';

/**
 * @fileOverview AI flow for generating mnemonics and memory aids.
 *
 * - createMemoryAid - A function that generates creative memory aids for a given concept.
 * - CreateMemoryAidInput - The input type for the createMemoryAid function.
 * - CreateMemoryAidOutput - The return type for the createMemoryAid function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateMemoryAidInputSchema = z.object({
  concept: z.string().min(3).describe('The concept, term, or list to create a memory aid for.'),
});
export type CreateMemoryAidInput = z.infer<typeof CreateMemoryAidInputSchema>;

const CreateMemoryAidOutputSchema = z.object({
  acronym: z.string().optional().describe('A creative acronym, if applicable.'),
  rhyme: z.string().optional().describe('A short, memorable rhyme or jingle.'),
  story: z.string().optional().describe('A very short story that helps remember the concept.'),
  imagery: z.string().optional().describe('A vivid visual imagery suggestion.'),
});
export type CreateMemoryAidOutput = z.infer<typeof CreateMemoryAidOutputSchema>;

export async function createMemoryAid(
  input: CreateMemoryAidInput
): Promise<CreateMemoryAidOutput> {
  return createMemoryAidFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createMemoryAidPrompt',
  input: {schema: CreateMemoryAidInputSchema},
  output: {schema: CreateMemoryAidOutputSchema},
  prompt: `You are a creativity expert specializing in crafting effective and memorable learning aids. A student needs help memorizing a concept.

Your task is to generate various types of mnemonics for the given concept. Provide at least two of the following: an acronym, a short rhyme/jingle, a memorable story, or a strong visual imagery suggestion.

Be creative, concise, and ensure the aids are directly related to the concept.

Concept to memorize:
---
{{{concept}}}
---
`,
});

const createMemoryAidFlow = ai.defineFlow(
  {
    name: 'createMemoryAidFlow',
    inputSchema: CreateMemoryAidInputSchema,
    outputSchema: CreateMemoryAidOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
