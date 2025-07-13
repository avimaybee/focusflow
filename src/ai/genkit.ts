
// src/ai/genkit.ts
'use server';
import {genkit} from 'genkit';
import {googleAI} from 'genkitx-googleai';
import {genkitxLangchain} from 'genkitx-langchain';

export const ai = genkit({
  plugins: [googleAI(), genkitxLangchain()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
