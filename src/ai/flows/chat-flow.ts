
// src/ai/flows/chat-flow.ts
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  createDiscussionPromptsTool,
  createFlashcardsTool,
  createMemoryAidTool,
  createQuizTool,
  createStudyPlanTool,
  explainConceptTool,
  highlightKeyInsightsTool,
  summarizeNotesTool,
} from '@/ai/tools';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PersonaIDs } from '@/lib/constants';
import { FirestoreSessionStore } from '@/lib/firestore-session-store';
import { googleAI } from '@genkit-ai/googleai';
import * as pdfjs from 'pdf-parse';

async function getPersonaPrompt(personaId: string): Promise<string> {
  const personaRef = doc(db, 'personas', personaId);
  const personaSnap = await getDoc(personaRef);
  if (personaSnap.exists()) {
    return personaSnap.data().prompt;
  }
  const fallbackRef = doc(db, 'personas', PersonaIDs.NEUTRAL);
  const fallbackSnap = await getDoc(fallbackRef);
  if (fallbackSnap.exists()) {
    return fallbackSnap.data().prompt;
  }
  return 'You are a helpful AI study assistant.';
}

async function saveGeneratedContent(
  userId: string,
  toolName: string,
  output: unknown,
  toolInput: unknown
) {
  if (!userId || !toolName || !output || !toolInput) return;

  let collectionName = '';
  let sourceText = '';

  switch (toolName) {
    case 'summarizeNotesTool':
      collectionName = 'summaries';
      sourceText = (toolInput as { notes: string }).notes;
      break;
    case 'createFlashcardsTool':
      collectionName = 'flashcardSets';
      sourceText = (toolInput as { topic: string }).topic;
      break;
    case 'createQuizTool':
      collectionName = 'quizzes';
      sourceText = (toolInput as { topic: string }).topic;
      break;
    case 'createStudyPlanTool':
      collectionName = 'studyPlans';
      sourceText = (toolInput as { topic: string }).topic;
      break;
    case 'highlightKeyInsightsTool':
      collectionName = 'insights';
      sourceText = (toolInput as { text: string }).text;
      break;
    default:
      return;
  }

  const data: Record<string, unknown> = {
    userId,
    sourceText: sourceText,
    createdAt: serverTimestamp(),
  };

  switch (toolName) {
    case 'summarizeNotesTool':
      data.title = (output as { title: string }).title || 'Summary';
      data.summary = (output as { summary: string }).summary;
      data.keywords = (output as { keywords: string[] }).keywords;
      break;
    case 'createFlashcardsTool':
      data.title = `Flashcards for: ${sourceText.substring(0, 40)}...`;
      data.flashcards = (output as { flashcards: unknown[] }).flashcards;
      break;
    case 'createQuizTool':
      data.title =
        (output as { title?: string }).title ||
        `Quiz for: ${sourceText.substring(0, 40)}...`;
      data.quiz = (output as { quiz: unknown }).quiz;
      break;
    case 'createStudyPlanTool':
      data.title = (output as { title?: string }).title || 'New Study Plan';
      data.plan = (output as { plan: unknown }).plan;
      break;
    case 'highlightKeyInsightsTool':
      data.title = `Key Insights for: ${sourceText.substring(0, 40)}...`;
      data.insights = (output as { insights: string[] }).insights;
      break;
  }

  try {
    const contentCollection = collection(db, 'users', userId, collectionName);
    await addDoc(contentCollection, data);
    console.log(`Saved ${collectionName} for user ${userId}`);
  } catch (error) {
    console.error(`Error saving ${collectionName} to Firestore:`, error);
  }
}

export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.object({
      userId: z.string(),
      message: z.string(),
      sessionId: z.string().optional(),
      persona: z.string().optional(),
      context: z.string().optional(), // This is the data URI for the attachment
    }),
    outputSchema: z.object({
        sessionId: z.string(),
        response: z.string()
    }),
    stream: true,
  },
  async (input, streamingCallback) => {
    console.log('DEBUG: chatFlow started with input:', input);
    const { userId, message, context, persona } = input;
    let { sessionId } = input;

    const store = new FirestoreSessionStore(userId);
    const session = sessionId 
        ? await ai.loadSession(sessionId, { store })
        : await ai.createSession({ store });
    
    sessionId = session.id;
    console.log(`DEBUG: Session loaded/created. ID: ${sessionId}`);

    const personaInstruction = await getPersonaPrompt(persona || 'neutral');
    const systemPrompt = `${personaInstruction} You are an expert AI assistant...`; // Truncated for brevity
    console.log('DEBUG: Persona prompt fetched.');

    const model = googleAI.model('gemini-1.5-flash');
    
    const chat = session.chat({
        model,
        system: systemPrompt,
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
    });
    console.log('DEBUG: Chat object created.');
    
    const userMessageContent: any[] = [{ text: message }];

    if (context) {
      console.log('DEBUG: Handling file context...');
      const mimeType = context.substring(5, context.indexOf(';'));
      userMessageContent.push({ media: { url: context, contentType: mimeType } });
    }

    let result;
    try {
      console.log('DEBUG: Attempting to call chat.send() to Gemini API...');
      result = await chat.send(userMessageContent, { streamingCallback });
      console.log('DEBUG: chat.send() call was successful.');
    } catch (error) {
      console.error('--- FATAL ERROR in chatFlow ---');
      console.error('DEBUG: The error occurred within the chat.send() call.');
      console.error('DEBUG: Full error object:', error);
      console.error('---------------------------------');
      throw error;
    }
    
    const toolCalls = result.history.at(-1)?.toolCalls;
    if (toolCalls && toolCalls.length > 0) {
      console.log('DEBUG: Handling tool calls...');
      for (const toolCall of toolCalls) {
        if (toolCall.output) {
            await saveGeneratedContent(userId, toolCall.name, toolCall.output, toolCall.input);
        }
      }
    }

    return {
        sessionId,
        response: result.text,
    };
  }
);
