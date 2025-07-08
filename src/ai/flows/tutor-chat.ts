'use server';

/**
 * @fileOverview AI flow for a conversational study tutor.
 *
 * - tutorChat - A function that provides contextual help on a subject.
 * - TutorChatInput - The input type for the tutorChat function.
 * - TutorChatOutput - The return type for the tutorChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string(),
});

export const TutorChatInputSchema = z.object({
  subject: z.string().describe('The subject the student is studying.'),
  history: z.array(ChatMessageSchema).describe('The history of the conversation so far.'),
  message: z.string().describe('The latest message from the student.'),
  image: z
    .string()
    .optional()
    .describe(
      "An optional image provided by the student (e.g., a photo of a math problem), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TutorChatInput = z.infer<typeof TutorChatInputSchema>;

export const TutorChatOutputSchema = z.object({
  response: z.string().describe("The AI tutor's helpful response."),
});
export type TutorChatOutput = z.infer<typeof TutorChatOutputSchema>;

export async function tutorChat(
  input: TutorChatInput
): Promise<TutorChatOutput> {
  return tutorChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tutorChatPrompt',
  input: {schema: TutorChatInputSchema},
  output: {schema: TutorChatOutputSchema},
  prompt: `You are an expert AI tutor, friendly, encouraging, and highly knowledgeable in a wide range of academic subjects. Your role is to help a student who is currently in a focused "Study Mode".

The student is studying: **{{{subject}}}**

Your task is to answer their questions, provide hints, and explain concepts related to this subject. Do not go off-topic. If they ask something unrelated to the subject, gently guide them back to their studies.

Keep your responses concise and easy to understand. Break down complex ideas into simple steps.

Here is the conversation history so far:
{{#each history}}
**{{role}}**: {{text}}
{{/each}}

Here is the student's latest message:
---
**user**: {{{message}}}
{{#if image}}
The user also provided this image:
{{media url=image}}
{{/if}}
---

Your response should be helpful and directly address their message in the context of their study subject.`,
});

const tutorChatFlow = ai.defineFlow(
  {
    name: 'tutorChatFlow',
    inputSchema: TutorChatInputSchema,
    outputSchema: TutorChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
