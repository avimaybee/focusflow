// src/ai/flows/chat-flow.ts
'use server';

import { ai } from '../genkit';
import { z } from 'zod';
import { marked } from 'marked';
import {
  createDiscussionPromptsTool,
  createFlashcardsTool,
  createMemoryAidTool,
  createQuizTool,
  createStudyPlanTool,
  explainConceptTool,
  highlightKeyInsightsTool,
  summarizeNotesTool,
} from './tools';
import { ChatInputSchema, ChatInput } from './chat-types';
import { FirestoreSessionStore } from '@/lib/firestore-session-store';
import { googleAI } from '@genkit-ai/googleai';

export const chat = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: z.object({
      response: z.string(),
      rawResponse: z.string(),
      sessionId: z.string(),
    }),
  },
  async (input: ChatInput) => {
    const { message, sessionId, persona, context, image } = input;

    const store = new FirestoreSessionStore();

    const session = sessionId
      ? await ai.loadSession(sessionId, { store })
      : ai.createSession({ store });

    const model = googleAI.model('gemini-1.5-flash');

    const chat = session.chat({
      model,
      tools: [
        summarizeNotesTool,
        createStudyPlanTool,
        createFlashcardsTool,
        createQuizTool,
        explainConceptTool,
        createMemoryAidTool,
        createDiscussionPromptsTool,
        highlightKeyInsightsTool,
      ],
      system: `You are an expert AI assistant and a helpful, conversational study partner. Your persona is ${persona}. Your responses should be well-structured and use markdown for formatting. If you need information from the user to use a tool (like source text for a quiz), and the user does not provide it, you must explain clearly why you need it and suggest ways the user can provide it. When you use a tool, the output will be a JSON string. You should then present this information to the user in a clear, readable format.`,
    });

    const prompt: any[] = [{ text: message }];
    if (context) {
      prompt.unshift({ text: `CONTEXT:\n${context}\n\nUSER'S REQUEST:\n` });
    }
    if (image) {
      prompt.push({ media: { url: image, contentType: 'image/*' } });
    }

    const response = await chat.send(prompt);
    const responseText = response.text;
    const formattedResponse = await marked.parse(responseText);

    return {
      response: formattedResponse,
      rawResponse: responseText,
      sessionId: session.id,
    };
  }
)