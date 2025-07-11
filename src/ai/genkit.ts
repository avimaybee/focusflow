import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // We set a default model here for general-purpose tasks and as a fallback.
  model: 'googleai/gemini-1.5-flash',
});
