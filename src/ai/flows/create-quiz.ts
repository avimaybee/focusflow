
/**
 * @fileOverview AI flow for generating a practice quiz from notes.
 *
 * - createQuiz - A function that generates a quiz from text or a PDF.
 * - CreateQuizInput - The input type for the createQuiz function.
 * - CreateQuizOutput - The return type for the createQuiz function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PersonaSchema } from './chat-types';

export const CreateQuizInputSchema = z
  .object({
    sourceText: z.string().optional().describe('The text notes to create the quiz from.'),
    sourcePdf: z
      .string()
      .optional()
      .describe(
        "A PDF file of notes, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'"
      ),
    persona: PersonaSchema.optional().describe('The AI persona to adopt when generating the quiz.'),
  })
  .refine((data) => data.sourceText || data.sourcePdf, {
    message: 'Either text notes or a PDF must be provided.',
  });
export type CreateQuizInput = z.infer<typeof CreateQuizInputSchema>;

const QuestionSchema = z.object({
    questionText: z.string().describe('The text of the multiple-choice question.'),
    options: z.array(z.string()).length(4).describe('An array of 4 possible answers for the question.'),
    correctAnswer: z.string().describe('The correct answer from the options array.'),
    explanation: z.string().describe('A brief explanation of why the answer is correct.')
});

const CreateQuizOutputSchema = z.object({
  title: z.string().describe('A short, engaging title for the quiz based on the notes.'),
  questions: z.array(QuestionSchema).describe('An array of 5 to 10 generated multiple-choice questions.'),
});
export type CreateQuizOutput = z.infer<typeof CreateQuizOutputSchema>;

export async function createQuiz(
  input: CreateQuizInput
): Promise<CreateQuizOutput> {
  return createQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createQuizPrompt',
  input: {schema: CreateQuizInputSchema},
  output: {schema: CreateQuizOutputSchema},
  prompt: `You are an expert curriculum designer specializing in creating practice quizzes for students. Your task is to generate a multiple-choice quiz from the provided notes.

{{#if persona}}
You must adopt the persona of a {{persona}} when generating the quiz.
{{/if}}

The quiz should consist of 5 to 10 questions that test the key concepts in the notes.
For each question, you must provide:
1.  The question text.
2.  Exactly four plausible options.
3.  The correct answer among the four options.
4.  A brief but clear explanation for why the answer is correct.

Generate a short, relevant title for the quiz as well.

{{#if sourceText}}
Notes Text: {{{sourceText}}}
{{/if}}

{{#if sourcePdf}}
Notes Document: {{media url=sourcePdf}}
{{/if}}
`,
});

const createQuizFlow = ai.defineFlow(
  {
    name: 'createQuizFlow',
    inputSchema: CreateQuizInputSchema,
    outputSchema: CreateQuizOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
