'use server';

/**
 * @fileOverview AI flow for explaining a concept within a body of text.
 *
 * - explainConcept - A function that provides a simple explanation and example for highlighted text.
 * - ExplainConceptInput - The input type for the explainConcept function.
 * - ExplainConceptOutput - The return type for the explainConcept function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainConceptInputSchema = z.object({
  highlightedText: z
    .string()
    .describe('The specific text, term, or concept the user has highlighted and wants explained.'),
  fullContextText: z
    .string()
    .describe('The complete text from which the highlight was taken, providing context.'),
});
export type ExplainConceptInput = z.infer<typeof ExplainConceptInputSchema>;

const ExplainConceptOutputSchema = z.object({
  explanation: z
    .string()
    .describe('A simple, concise explanation of the highlighted concept, tailored to a student.'),
  example: z
    .string()
    .describe(
      'A relevant and easy-to-understand example or analogy for the concept.'
    ),
});
export type ExplainConceptOutput = z.infer<typeof ExplainConceptOutputSchema>;

export async function explainConcept(
  input: ExplainConceptInput
): Promise<ExplainConceptOutput> {
  // Validate the input against the Zod schema.
  const validationResult = ExplainConceptInputSchema.safeParse(input);
  if (!validationResult.success) {
    console.error('Invalid input for explainConcept:', validationResult.error.flatten());
    throw new Error('Invalid input provided for concept explanation.');
  }

  // Call the flow with the validated data.
  return explainConceptFlow(validationResult.data);
}

const prompt = ai.definePrompt({
  name: 'explainConceptPrompt',
  input: {schema: ExplainConceptInputSchema},
  output: {schema: ExplainConceptOutputSchema},
  prompt: `You are an expert AI tutor. A student has highlighted a term or phrase within their notes and needs an explanation.

Your task is to explain the highlighted text in a simple, concise way. Use the full context to understand the domain and tailor your explanation accordingly. Avoid jargon.

After the explanation, provide a very clear and simple example or analogy to solidify their understanding.

Full Context:
---
{{{fullContextText}}}
---

Highlighted Text to Explain: "{{{highlightedText}}}"
`,
});

const explainConceptFlow = ai.defineFlow(
  {
    name: 'explainConceptFlow',
    inputSchema: ExplainConceptInputSchema,
    outputSchema: ExplainConceptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
