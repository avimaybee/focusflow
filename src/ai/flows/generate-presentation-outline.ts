
/**
 * @fileOverview AI flow for generating a presentation outline from notes.
 *
 * - generatePresentationOutline - A function that generates an outline from text or a PDF.
 * - GeneratePresentationOutlineInput - The input type for the function.
 * - GeneratePresentationOutlineOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PersonaSchema } from './chat-types';

export const GeneratePresentationOutlineInputSchema = z
  .object({
    sourceText: z.string().optional().describe('The source text to generate the outline from.'),
    sourcePdf: z
      .string()
      .optional()
      .describe(
        "A PDF file of notes, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
      ),
    persona: PersonaSchema.optional().describe('The AI persona to adopt when generating the outline.'),
  })
  .refine(data => data.sourceText || data.sourcePdf, {
    message: 'Either text or a PDF must be provided.',
  });
export type GeneratePresentationOutlineInput = z.infer<typeof GeneratePresentationOutlineInputSchema>;

const SlideSchema = z.object({
  title: z.string().describe('The title of the presentation slide.'),
  bulletPoints: z.array(z.string()).describe('An array of key bullet points for the slide content.')
});

export const GeneratePresentationOutlineOutputSchema = z.object({
  title: z.string().describe('The main title for the presentation.'),
  slides: z.array(SlideSchema).describe('An array of 5-10 generated slides for the presentation.')
});
export type GeneratePresentationOutlineOutput = z.infer<typeof GeneratePresentationOutlineOutputSchema>;

export async function generatePresentationOutline(
  input: GeneratePresentationOutlineInput
): Promise<GeneratePresentationOutlineOutput> {
  return generatePresentationOutlineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePresentationOutlinePrompt',
  input: {schema: GeneratePresentationOutlineInputSchema},
  output: {schema: GeneratePresentationOutlineOutputSchema},
  prompt: `You are an expert presentation designer. Your task is to generate a clear and structured presentation outline from the provided source material.

{{#if persona}}
You must adopt the persona of a {{persona}} when generating the outline.
{{/if}}

The presentation should have a main title and between 5 to 10 slides. Each slide must have a concise title and 3-5 key bullet points.

Focus on creating a logical flow, from introduction to conclusion.

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

const generatePresentationOutlineFlow = ai.defineFlow(
  {
    name: 'generatePresentationOutlineFlow',
    inputSchema: GeneratePresentationOutlineInputSchema,
    outputSchema: GeneratePresentationOutlineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
