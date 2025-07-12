/**
 * @fileOverview AI flow for highlighting key insights from text.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PersonaSchema } from './chat-types';

export const HighlightKeyInsightsInputSchema = z
  .object({
    sourceText: z.string().optional().describe('The source text to extract insights from.'),
    sourcePdf: z
      .string()
      .optional()
      .describe(
        "A PDF file of notes, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
      ),
    persona: PersonaSchema.optional().describe('The AI persona to adopt when extracting insights.'),
  })
  .refine(data => data.sourceText || data.sourcePdf, {
    message: 'Either text or a PDF must be provided.',
  });
export type HighlightKeyInsightsInput = z.infer<typeof HighlightKeyInsightsInputSchema>;

export const HighlightKeyInsightsOutputSchema = z.object({
  insights: z.array(z.string()).describe('An array of 3-5 key insights, takeaways, or "aha!" moments from the text.')
});
export type HighlightKeyInsightsOutput = z.infer<typeof HighlightKeyInsightsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'highlightKeyInsightsPrompt',
  input: {schema: HighlightKeyInsightsInputSchema},
  output: {schema: HighlightKeyInsightsOutputSchema},
  prompt: `You are an expert analyst. Your task is to read the provided source material and extract the 3-5 most important insights or "aha!" moments.

{{#if persona}}
You must adopt the persona of a {{persona}} when extracting the insights.
{{/if}}

Focus on the deeper meanings, conclusions, or surprising facts that are not immediately obvious. These should be the key takeaways a student should remember.

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

export const highlightKeyInsightsFlow = ai.defineFlow(
  {
    name: 'highlightKeyInsightsFlow',
    inputSchema: HighlightKeyInsightsInputSchema,
    outputSchema: HighlightKeyInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);