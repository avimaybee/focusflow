/**
 * @fileOverview Generates a personalized weekly study plan based on user inputs.
 *
 * - createStudyPlan - A function that generates the study plan.
 * - CreateStudyPlanInput - The input type for the createStudyPlan function.
 * - CreateStudyPlanOutput - The return type for the createStudyPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const CreateStudyPlanInputSchema = z.object({
  subjects: z
    .string()
    .describe('List of subjects to study, separated by commas.'),
  examDate: z.string().describe('The date of the exam (YYYY-MM-DD).'),
  weeklyStudyTime: z
    .number()
    .describe('The total number of hours available for studying per week.'),
});
export type CreateStudyPlanInput = z.infer<typeof CreateStudyPlanInputSchema>;

const DailyPlanSchema = z.object({
    day: z.string().describe('The day of the week (e.g., Monday, Tuesday).'),
    tasks: z.string().describe('A concise summary of the subjects and topics to study for that day.'),
});

const CreateStudyPlanOutputSchema = z.object({
  title: z.string().describe('A concise and relevant title for the study plan, like "Finals Prep for Biology & History".'),
  plan: z.array(DailyPlanSchema).length(7).describe('A 7-day study plan, with one entry for each day of the week.'),
});
export type CreateStudyPlanOutput = z.infer<typeof CreateStudyPlanOutputSchema>;


export async function createStudyPlan(input: CreateStudyPlanInput): Promise<CreateStudyPlanOutput> {
  return createStudyPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createStudyPlanPrompt',
  input: {schema: CreateStudyPlanInputSchema},
  output: {schema: CreateStudyPlanOutputSchema},
  prompt: `You are an expert AI study planner. Your task is to generate a structured, effective weekly study plan for a student based on their inputs.

The plan should be for a full 7-day week.

Based on the subjects, exam date, and available weekly study time, create a balanced schedule. Allocate more time to subjects that might need it and ensure a mix of topics to keep the student engaged.

Generate a concise title for the plan.

Student's Information:
- Subjects: {{{subjects}}}
- Exam Date: {{{examDate}}}
- Total Weekly Study Time: {{{weeklyStudyTime}}} hours

Please provide the output in the requested JSON format.`,config: {
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
