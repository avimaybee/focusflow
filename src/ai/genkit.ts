
// src/ai/genkit.ts
'use server';
import { genkit } from 'genkit/beta';
import { googleAI } from '@genkit-ai/googleai';

// DEBUG: Log the environment variable at module load time.
// This should appear in your server terminal when you run `npm run dev`.
console.log('--- DEBUG: Loading src/ai/genkit.ts ---');
console.log('DEBUG: GEMINI_API_KEY is:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
console.log('------------------------------------');

export const ai = genkit({
  plugins: [googleAI()], // Relying on the environment variable
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
