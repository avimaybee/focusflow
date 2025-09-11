'use server';

import { z } from 'zod';
import { configureGenkit } from 'genkit';
import { defineFlow, runFlow, ai } from 'genkit/beta';
import { googleAI } from '@genkit-ai/googleai';
import { defaultPersonas } from '@/lib/personas';
import { SupabaseSessionStore } from '@/lib/supabase-session-store';
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
  sessionId: z.string().optional(),
  personaId: z.string().optional(),
});

type ChatFlowInput = z.infer<typeof chatFlowInputSchema>;

export const chatFlow = defineFlow(
  {
    name: 'chatFlow',
    inputSchema: chatFlowInputSchema,
    outputSchema: z.any(), // Define a more specific output schema if needed
  },
  async (input) => {
    const { message, sessionId, personaId } = input;

    const store = new SupabaseSessionStore();

    // Load an existing session or create a new one.
    // Genkit will handle ID generation for new sessions.
    const session = await (sessionId
      ? ai.loadSession(sessionId, { store })
      : ai.createSession({ store }));

    const selectedPersona: PersonaDetails | undefined = defaultPersonas.find(p => p.id === personaId);
    const personaPrompt = selectedPersona?.prompt || defaultPersonas.find(p => p.id === 'neutral')!.prompt;

    // Get a chat instance from the session. It will use the session's history.
    const chat = session.chat({
        model: googleAI.model('gemini-2.0-flash-lite'),
        system: personaPrompt,
        config: {
            temperature: 0.7,
        },
    });

    const response = await chat.send(message);

    // When using a session with a store, Genkit automatically saves the new
    // message and response to the history.

    return {
      sessionId: session.id, // Return the session ID (it will be new for a new chat)
      response: response.text(),
    };
  }
);
