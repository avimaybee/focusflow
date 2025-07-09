
'use server';
/**
 * @fileOverview AI flow for converting text to bullet points.
 *
 * - generateBulletPoints - A function that converts text to bullet points.
 * - GenerateBulletPointsInput - The input type for the function.
 * - GenerateBulletPointsOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PersonaSchema } from './chat-types';

const GenerateBulletPointsInputSchema = z.object({
  textToConvert: z.string().describe('The text to be converted into bullet points.'),
  persona: PersonaSchema.optional().describe('The AI persona to adopt.'),
});
export type GenerateBulletPointsInput = z.infer<typeof GenerateBulletPointsInputSchema>;

const GenerateBulletPointsOutputSchema = z.object({
  bulletPoints: z.array(z.string()).describe('An array of strings, where each string is a key point.'),
});
export type GenerateBulletPointsOutput = z.infer<typeof GenerateBulletPointsOutputSchema>;

export async function generateBulletPoints(
  input: GenerateBulletPointsInput
): Promise<GenerateBulletPointsOutput> {
  return generateBulletPointsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBulletPointsPrompt',
  input: {schema: GenerateBulletPointsInputSchema},
  output: {schema: GenerateBulletPointsOutputSchema},
  prompt: `You are an expert editor. Your task is to extract the key points from the following text and format them as a concise list.

{{#if persona}}
You must adopt the persona of a {{persona}} when generating the bullet points.
{{/if}}

Text to Convert:
---
{{{textToConvert}}}
---

Please provide only the key points in your response.
`,
});

const generateBulletPointsFlow = ai.defineFlow(
  {
    name: 'generateBulletPointsFlow',
    inputSchema: GenerateBulletPointsInputSchema,
    outputSchema: GenerateBulletPointsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
