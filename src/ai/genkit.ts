// src/ai/genkit.ts
'use server';
import {genkit} from 'genkit/beta';
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit and set up the AI model
export const ai = genkit({
  plugins: [googleAI()],
  // We set a default model here for general-purpose tasks and as a fallback.
  model: 'googleai/gemini-1.5-flash',
});
