'use server';

import { z } from 'zod';
import { defaultPersonas } from '@/lib/personas';
import type { PersonaDetails } from '@/types/chat-types';
import { createChatSession, addMessageToChat } from '@/lib/chat-actions';

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${API_KEY}`;

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
  const { message, history, personaId, userId, isGuest } = validatedInput;
  let { sessionId } = validatedInput;

  if (!API_KEY) {
    throw new Error('The GEMINI_API_KEY environment variable is not set.');
  }

  // If it's a new chat for a logged-in user, create a session first.
  if (!sessionId && !isGuest) {
    // Use the first part of the message as a preliminary title.
    const newTitle = message.length > 40 ? message.substring(0, 40) + '...' : message;
    const { data: newSession, error } = await createChatSession(userId, newTitle);
    if (error || !newSession) {
      console.error("Error creating new chat session:", error);
      throw new Error("Could not start a new chat session.");
    }
    sessionId = newSession.id;
  }

  // Save user message for logged-in users.
  if (sessionId && !isGuest) {
    const { error } = await addMessageToChat(sessionId, 'user', message);
    if (error) {
      // Log the error but don't block the chat flow.
      console.error(`Error saving user message for session ${sessionId}:`, error);
    }
  }

  const selectedPersona: PersonaDetails | undefined = defaultPersonas.find(p => p.id === personaId);
  const personaPrompt = selectedPersona?.prompt || defaultPersonas.find(p => p.id === 'neutral')!.prompt;

  const apiHistory = (history || []).map(h => ({
    role: h.role,
    parts: [{ text: h.text }],
  }));

  const contents = [
    { role: 'user', parts: [{ text: personaPrompt }] },
    { role: 'model', parts: [{ text: "Okay, I understand. I will act as that persona. What is the first question?" }] },
    ...apiHistory,
    { role: 'user', parts: [{ text: message }] },
  ];

  const requestPayload = {
    contents,
    generationConfig: {
      temperature: 0.7,
      topK: 1,
      topP: 1,
      maxOutputTokens: 8192,
    },
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    // Save model response for logged-in users.
    if (sessionId && !isGuest) {
      const { error } = await addMessageToChat(sessionId, 'model', generatedText);
      if (error) {
        // Log the error but don't block the chat flow.
        console.error(`Error saving model response for session ${sessionId}:`, error);
      }
    }

    return {
      sessionId: sessionId,
      response: generatedText,
      rawResponse: generatedText,
      persona: selectedPersona || defaultPersonas.find(p => p.id === 'neutral'),
    };
  } catch (error) {
    console.error('Error in chatFlow:', error);
    throw error;
  }
}
