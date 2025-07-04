'use server';

/**
 * @fileOverview AI flow for summarizing notes from text or PDF.
 *
 * - summarizeNotes - A function that summarizes notes using the Gemini API.
 * - SummarizeNotesInput - The input type for the summarizeNotes function.
 * - SummarizeNotesOutput - The return type for the summarizeNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeNotesInputSchema = z
  .object({
    textNotes: z.string().optional().describe('The text notes to summarize.'),
    pdfNotes: z
      .string()
      .optional()
      .describe(
        "A PDF file of notes, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
      ),
  })
  .refine(data => data.textNotes || data.pdfNotes, {
    message: 'Either text notes or PDF notes must be provided.',
  });
export type SummarizeNotesInput = z.infer<typeof SummarizeNotesInputSchema>;

const SummarizeNotesOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the notes.'),
  keywords: z.string().describe('Keywords extracted from the notes.'),
});
export type SummarizeNotesOutput = z.infer<typeof SummarizeNotesOutputSchema>;

export async function summarizeNotes(
  input: SummarizeNotesInput
): Promise<SummarizeNotesOutput> {
  return summarizeNotesFlow(input);
}

const summarizeNotesPrompt = ai.definePrompt({
  name: 'summarizeNotesPrompt',
  input: {schema: SummarizeNotesInputSchema},
  output: {schema: SummarizeNotesOutputSchema},
  prompt: `You are an AI assistant that summarizes notes for students. Provide a concise summary of the provided notes and extract key keywords.

{{#if textNotes}}
Notes Text: {{{textNotes}}}
{{/if}}

{{#if pdfNotes}}
Notes Document: {{media url=pdfNotes}}
{{/if}}

Summary:
Keywords:`,
});

const summarizeNotesFlow = ai.defineFlow(
  {
    name: 'summarizeNotesFlow',
    inputSchema: SummarizeNotesInputSchema,
    outputSchema: SummarizeNotesOutputSchema,
  },
  async input => {
    const {output} = await summarizeNotesPrompt(input);
    return output!;
  }
);
