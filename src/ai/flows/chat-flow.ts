'use server';

import { z } from 'zod';
import { getPersonaById, getDefaultPersona } from '@/lib/persona-actions';

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

const chatFlowInputSchema = z.object({
  message: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    text: z.string(),
  })).optional(),
  userId: z.string(),
  isGuest: z.boolean(),
  sessionId: z.string().optional(),
  personaId: z.string().optional(),
  context: z.any().optional(),
});

type ChatFlowInput = z.infer<typeof chatFlowInputSchema>;

export async function chatFlow(input: ChatFlowInput) {
  const validatedInput = chatFlowInputSchema.parse(input);
  const { message, history, personaId } = validatedInput;

  if (!API_KEY) {
    throw new Error('The GEMINI_API_KEY environment variable is not set.');
  }

  // Fetch persona from database
  const selectedPersona = personaId 
    ? await getPersonaById(personaId) 
    : await getDefaultPersona();
  
  const personaPrompt = selectedPersona?.prompt || 'You are a helpful AI assistant.';

  // Construct the conversation history for the API
  const apiHistory = (history || []).map(h => ({
    role: h.role,
    parts: [{ text: h.text }],
  }));

  const contents = apiHistory.length === 0
    ? [
        { role: 'user', parts: [{ text: personaPrompt }] },
        { role: 'model', parts: [{ text: "Okay, I understand. I will act as that persona. What is the first question?" }] },
        { role: 'user', parts: [{ text: message }] },
      ]
    : [
        ...apiHistory,
        { role: 'user', parts: [{ text: message }] },
      ];

  const requestPayload = {
    contents,
    generationConfig: {
      temperature: 0.7,
      topK: 1,
      topP: 1,
      maxOutputTokens: 65536, // Increased from 8192 for longer, detailed student responses
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
      persona: selectedPersona || await getDefaultPersona(),
    };
  } catch (error) {
    console.error('Error in chatFlow:', error);
    // Re-throw the error to be caught by the API route's error handler
    throw error;
  }
}
