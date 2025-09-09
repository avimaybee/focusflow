'use server';

import { z } from 'zod';
// NOTE: Importing from a client-side hook file into a server-side flow
// is not ideal. In a larger application, this persona data should be
// sourced from a shared location or a database. For now, this is the
// most direct way to access the persona prompts.
import { defaultPersonas } from '@/hooks/use-persona-manager';
import type { PersonaDetails } from '@/types/chat-types';

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

const chatFlowInputSchema = z.object({
  message: z.string(),
  userId: z.string(),
  isGuest: z.boolean(),
  sessionId: z.string().optional(),
  personaId: z.string().optional(),
  context: z.any().optional(),
});

type ChatFlowInput = z.infer<typeof chatFlowInputSchema>;

export async function chatFlow(input: ChatFlowInput) {
  const validatedInput = chatFlowInputSchema.parse(input);
  const { message, personaId } = validatedInput;

  if (!API_KEY) {
    throw new Error('The GEMINI_API_KEY environment variable is not set.');
  }

  const selectedPersona: PersonaDetails | undefined = defaultPersonas.find(p => p.id === personaId);
  const personaPrompt = selectedPersona?.prompt || defaultPersonas.find(p => p.id === 'neutral')!.prompt;

  const requestPayload = {
    contents: [
      {
        parts: [
          { text: personaPrompt },
          { text: `\n\nUser Message: "${message}"` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    },
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Gemini API Error:', errorBody);
      throw new Error(`Gemini API request failed with status ${response.status}: ${errorBody.error?.message || 'Unknown error'}`);
    }

    const responseData = await response.json();

    if (!responseData.candidates || responseData.candidates.length === 0 || !responseData.candidates[0].content.parts[0].text) {
        console.error('Invalid response structure from Gemini API:', responseData);
        throw new Error('Received an invalid response from the Gemini API.');
    }

    const generatedText = responseData.candidates[0].content.parts[0].text;

    return {
      sessionId: validatedInput.sessionId || 'new-session',
      response: generatedText,
      rawResponse: generatedText,
      persona: selectedPersona || defaultPersonas.find(p => p.id === 'neutral'),
    };
  } catch (error) {
    console.error('Error in chatFlow:', error);
    // Re-throw the error to be caught by the API route's error handler
    throw error;
  }
}
