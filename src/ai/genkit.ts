import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // We remove the default model here because it will now be selected dynamically.
  // model: 'googleai/gemini-2.0-flash',
});
