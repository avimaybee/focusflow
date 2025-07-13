
'use server';
/**
 * @fileOverview A minimal Genkit flow for testing the basic connection to the Gemini API.
 * This flow removes all complexity like sessions, tools, and personas.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

export const simpleTestFlow = ai.defineFlow(
  {
    name: 'simpleTestFlow',
    inputSchema: z.object({
      message: z.string(),
    }),
    outputSchema: z.object({
      response: z.string(),
    }),
  },
  async (input) => {
    console.log('--- DEBUG: simpleTestFlow started ---');
    console.log('Input:', input.message);
    
    try {
      const model = googleAI.model('gemini-1.5-flash');
      
      console.log('DEBUG: Generating content with model...');
      const { output } = await ai.generate({
        model,
        prompt: input.message,
      });

      if (!output) {
        throw new Error('No output from model');
      }
      
      const responseText = output as string;
      console.log('DEBUG: Received response from model:', responseText.substring(0, 100));

      console.log('--- DEBUG: simpleTestFlow completed successfully ---');
      return { response: responseText };

    } catch (error: any) {
      console.error('--- FATAL ERROR in simpleTestFlow ---');
      console.error('Error:', error);
      console.error('Stack:', error.stack);
      console.error('-------------------------------------');
      throw error;
    }
  }
);
