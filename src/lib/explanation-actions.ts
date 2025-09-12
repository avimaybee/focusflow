'use server';

import { marked } from 'marked';
import { runFlow } from 'genkit/beta';
import { chatFlow } from '@/ai/flows/chat-flow';
import { ExplainConceptInputSchema } from '@/types/chat-types';

/**
 * Gets a detailed explanation for a given concept using the main chat flow.
 * @param concept The concept to explain.
 * @returns An HTML string with the formatted explanation and analogy.
 */
export async function getExplanation(concept: string): Promise<string> {
  try {
    // Validate the input to ensure it's a non-empty string.
    const input = ExplainConceptInputSchema.parse({ concept });

    // Construct a specific message to send to the chat flow.
    const message = `Please explain the concept: "${input.concept}"`;

    // Call the main chatFlow using runFlow.
    // We use a guest user here as this is a stateless, informational query.
    const result = await runFlow(chatFlow, {
      message: message,
      personaId: 'in-depth-explainer', // Use the in-depth explainer for this tool
    });

    const html = await marked.parse(result.response);

    return html;
  } catch (error) {
    console.error(`Error getting explanation for "${concept}":`, error);
    // Return a user-friendly error message in HTML format.
    return '<p class="text-destructive">Sorry, I was unable to generate an explanation for that concept.</p>';
  }
}
