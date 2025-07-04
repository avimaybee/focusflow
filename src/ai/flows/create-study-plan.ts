'use server';

/**
 * @fileOverview Generates a personalized weekly study plan based on user inputs.
 *
 * - createStudyPlan - A function that generates the study plan.
 * - CreateStudyPlanInput - The input type for the createStudyPlan function.
 * - CreateStudyPlanOutput - The return type for the createStudyPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateStudyPlanInputSchema = z.object({
  subjects: z
    .string()
    .describe('List of subjects to study, separated by commas.'),
  examDate: z.string().describe('The date of the exam (YYYY-MM-DD).'),
  weeklyStudyTime: z
    .number()
    .describe('The total number of hours available for studying per week.'),
});
export type CreateStudyPlanInput = z.infer<typeof CreateStudyPlanInputSchema>;

const CreateStudyPlanOutputSchema = z.object({
  studyPlan: z
    .string()
    .describe('A weekly study plan as a table or calendar format.'),
});
export type CreateStudyPlanOutput = z.infer<typeof CreateStudyPlanOutputSchema>;

export async function createStudyPlan(input: CreateStudyPlanInput): Promise<CreateStudyPlanOutput> {
  return createStudyPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createStudyPlanPrompt',
  input: {schema: CreateStudyPlanInputSchema},
  output: {schema: CreateStudyPlanOutputSchema},
  prompt: `You are an AI study planner. Generate a weekly study plan for a student based on the following information:

Subjects: {{{subjects}}}
Exam Date: {{{examDate}}}
Weekly Study Time: {{{weeklyStudyTime}}} hours

The study plan should be in a table format, showing each day of the week and the subjects to study for that day. Be concise and create the best possible plan for the student to succeed in their exams.`,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  }
});

const createStudyPlanFlow = ai.defineFlow(
  {
    name: 'createStudyPlanFlow',
    inputSchema: CreateStudyPlanInputSchema,
    outputSchema: CreateStudyPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
