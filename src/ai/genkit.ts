
// src/ai/genkit.ts
import { genkit } from 'genkit/beta';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({ projectId: 'focusflow-ai-w1jt3', location: 'us-central1' })],
  logLevel: 'debug',
  enableTracingAndMetrics: false,
});
