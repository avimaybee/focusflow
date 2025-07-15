'use server';

import { explainConceptTool } from '@/ai/tools';
import { ExplainConceptInputSchema } from '@/types/chat-types';
import { marked } from 'marked';

/**
 * Gets a detailed explanation for a given concept using an AI tool.
 * @param concept The concept to explain.
 * @returns An HTML string with the formatted explanation and analogy.
 */
export async function getExplanation(concept: string): Promise<string> {
  try {
    // Validate the input against the schema.
    const input = ExplainConceptInputSchema.parse({ concept });
    
    // The tool is already defined and imported from `src/ai/tools.ts`.
    // We just need to call it with the validated input.
    const result = await explainConceptTool(input);
    
    // The tool returns an object: { explanation: string, analogy: string }.
    // We format this into a nice Markdown string and then parse it to HTML.
    const markdown = `### Explanation\n${result.explanation}\n\n**Analogy:** ${result.analogy}`;
    const html = await marked.parse(markdown);

    return html;
  } catch (error) {
    console.error(`Error getting explanation for "${concept}":`, error);
    // Return a user-friendly error message in HTML format.
    return '<p class="text-destructive">Sorry, I was unable to generate an explanation for that concept.</p>';
  }
}