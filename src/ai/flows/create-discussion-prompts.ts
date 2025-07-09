
/**
 * @fileOverview AI flow for generating study group discussion prompts from notes.
 *
 * - createDiscussionPrompts - A function that generates prompts from text.
 * - CreateDiscussionPromptsInput - The input type for the function.
 * - CreateDiscussionPromptsOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PersonaSchema } from './chat-types';

export const CreateDiscussionPromptsInputSchema = z
  .object({
    sourceText: z.string().optional().describe('The source text to generate discussion prompts from.'),
    sourcePdf: z
      .string()
      .optional()
      .describe(
        "A PDF file of notes, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
      ),
    persona: PersonaSchema.optional().describe('The AI persona to adopt when generating the prompts.'),
  })
  .refine(data => data.sourceText || data.sourcePdf, {
    message: 'Either text or a PDF must be provided.',
  });
export type CreateDiscussionPromptsInput = z.infer<typeof CreateDiscussionPromptsInputSchema>;

const PromptSchema = z.object({
  type: z.enum(['Question', 'Scenario', 'Debate Topic']).describe('The category of the prompt.'),
  text: z.string().describe('The discussion prompt, question, or scenario text.')
});

export const CreateDiscussionPromptsOutputSchema = z.object({
  prompts: z.array(PromptSchema).describe('An array of 5-7 generated discussion prompts covering different types.')
});
export type CreateDiscussionPromptsOutput = z.infer<typeof CreateDiscussionPromptsOutputSchema>;

export async function createDiscussionPrompts(
  input: CreateDiscussionPromptsInput
): Promise<CreateDiscussionPromptsOutput> {
  return createDiscussionPromptsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createDiscussionPromptsPrompt',
  input: {schema: CreateDiscussionPromptsInputSchema},
  output: {schema: CreateDiscussionPromptsOutputSchema},
  prompt: `You are an expert academic facilitator. Your task is to generate a set of engaging discussion prompts for a study group based on the provided text.

{{#if persona}}
You must adopt the persona of a {{persona}} when generating the prompts.
{{/if}}

The prompts should encourage critical thinking, debate, and deeper understanding of the material.

Create a mix of the following types of prompts:
- Open-ended questions that go beyond simple fact recall.
- Hypothetical scenarios that require applying the concepts.
- Debate topics that present two sides of an argument found in the text.

Generate between 5 and 7 prompts in total.

{{#if sourceText}}
Source Text:
---
{{{sourceText}}}
---
{{/if}}

{{#if sourcePdf}}
Source Document: {{media url=sourcePdf}}
{{/if}}
`,
});

const createDiscussionPromptsFlow = ai.defineFlow(
  {
    name: 'createDiscussionPromptsFlow',
    inputSchema: CreateDiscussionPromptsInputSchema,
    outputSchema: CreateDiscussionPromptsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
