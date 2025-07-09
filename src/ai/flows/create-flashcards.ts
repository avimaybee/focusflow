
/**
 * @fileOverview AI flow for generating flashcards from notes.
 *
 * - createFlashcards - A function that generates flashcards from text or a PDF.
 * - CreateFlashcardsInput - The input type for the createFlashcards function.
 * - CreateFlashcardsOutput - The return type for the createFlashcards function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PersonaSchema } from './chat-types';

export const CreateFlashcardsInputSchema = z
  .object({
    sourceText: z.string().optional().describe('The text notes to create flashcards from.'),
    sourcePdf: z
      .string()
      .optional()
      .describe(
        "A PDF file of notes, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
      ),
    persona: PersonaSchema.optional().describe('The AI persona to adopt when generating the flashcards.'),
  })
  .refine((data) => data.sourceText || data.sourcePdf, {
    message: 'Either text notes or a PDF must be provided.',
  });
export type CreateFlashcardsInput = z.infer<typeof CreateFlashcardsInputSchema>;

const FlashcardSchema = z.object({
    question: z.string().describe('A concise question based on a key concept from the notes.'),
    answer: z.string().describe('A clear and accurate answer to the question.')
});

const CreateFlashcardsOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe('An array of generated flashcard objects, each with a question and an answer.'),
});
export type CreateFlashcardsOutput = z.infer<typeof CreateFlashcardsOutputSchema>;

export async function createFlashcards(
  input: CreateFlashcardsInput
): Promise<CreateFlashcardsOutput> {
  return createFlashcardsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createFlashcardsPrompt',
  input: {schema: CreateFlashcardsInputSchema},
  output: {schema: CreateFlashcardsOutputSchema},
  prompt: `You are an expert educator specializing in creating effective study materials. Your task is to generate a set of high-quality, concise flashcards from the provided notes.

{{#if persona}}
You must adopt the persona of a {{persona}} when generating the flashcards.
{{/if}}

For each flashcard, create a clear question that tests a key concept, and a direct, accurate answer.

Focus on the most important information, definitions, key figures, and core concepts. Generate between 5 and 15 flashcards.

{{#if sourceText}}
Notes Text: {{{sourceText}}}
{{/if}}

{{#if sourcePdf}}
Notes Document: {{media url=sourcePdf}}
{{/if}}
`,
});

const createFlashcardsFlow = ai.defineFlow(
  {
    name: 'createFlashcardsFlow',
    inputSchema: CreateFlashcardsInputSchema,
    outputSchema: CreateFlashcardsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
