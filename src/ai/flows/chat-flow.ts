'use server';

import { z } from 'zod';
import { configureGenkit } from 'genkit';
import { defineFlow, runFlow, ai } from 'genkit/beta';
import { googleAI } from '@genkit-ai/googleai';
import { defaultPersonas } from '@/lib/personas';
import type { PersonaDetails } from '@/types/chat-types';

// Initialize Genkit with the Google AI plugin
configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  logSinks: [], // You can configure logging sinks here if needed
  enableTracingAndMetrics: true,
});

const chatFlowInputSchema = z.object({
  message: z.string(),
  personaId: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    text: z.string(),
  })).optional(),
});

type ChatFlowInput = z.infer<typeof chatFlowInputSchema>;

export const chatFlow = defineFlow(
  {
    name: 'chatFlow',
    inputSchema: chatFlowInputSchema,
    outputSchema: z.any(),
  },
  async (input) => {
    const { message, personaId, history } = input;

    const selectedPersona: PersonaDetails | undefined = defaultPersonas.find(p => p.id === personaId);
    const personaPrompt = selectedPersona?.prompt || defaultPersonas.find(p => p.id === 'neutral')!.prompt;

    const messages = (history || []).flatMap(h => [
        { role: h.role, parts: [{ text: h.text }] }
    ]);

    // Create a new, stateless chat session on every request.
    const chat = ai.chat({
        model: googleAI.model('gemini-2.0-flash-lite'),
        system: personaPrompt,
        history: messages,
        config: {
            temperature: 0.7,
        },
    });

    const response = await chat.send(message);

    return {
      response: response.text(),
    };
  }
);
