
// src/ai/flows/chat-flow.ts
console.log('DEBUG: Loading /ai/flows/chat-flow.ts module');

import { ai } from '@/ai/genkit';
import { z } from 'zod';
// ... (rest of the file is unchanged)

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
import { doc, getDoc, serverTimestamp, collection, addDoc } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase-admin';
import { PersonaIDs } from '@/lib/constants';
import { FirestoreSessionStore } from '@/lib/firestore-session-store';
import { googleAI } from '@genkit-ai/googleai';

console.log('DEBUG: /ai/flows/chat-flow.ts module loaded, imports processed');

async function getPersonaPrompt(personaId: string): Promise<string> {
  try {
    const personaRef = db.collection('personas').doc(personaId);
    const personaSnap = await personaRef.get();
    if (personaSnap.exists) {
      return personaSnap.data()!.prompt;
    }
    
    const fallbackRef = db.collection('personas').doc(PersonaIDs.NEUTRAL);
    const fallbackSnap = await fallbackRef.get();
    if (fallbackSnap.exists) {
      return fallbackSnap.data()!.prompt;
    }
    
    return 'You are a helpful AI study assistant.';
  } catch (error) {
    console.error('Error fetching persona prompt:', error);
    return 'You are a helpful AI study assistant.';
  }
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
    const contentCollection = db.collection('users').doc(userId).collection(collectionName);
    await contentCollection.add(data);
    console.log(`Saved ${collectionName} for user ${userId}`);
  } catch (error) {
    console.error(`Error saving ${collectionName} to Firestore:`, error);
  }
}

console.log('DEBUG: Defining chatFlow...');
export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.object({
      userId: z.string(), // This is now validated server-side
      message: z.string(),
      sessionId: z.string().optional(),
      persona: z.string().optional(),
      context: z.string().optional(),
    }),
    outputSchema: z.object({
        sessionId: z.string(),
        response: z.string()
    }),
    stream: true,
  },
  async (input, streamingCallback) => {
    console.log('--- CHAT FLOW EXECUTION START ---');
    const { userId, message, context, persona } = input;
    let { sessionId } = input;
    console.log(`DEBUG: Flow inputs - userId: ${userId}, sessionId: ${sessionId}, persona: ${persona}`);

    try {
      console.log('DEBUG: Creating Firestore session store...');
      const store = new FirestoreSessionStore(userId);
      
      const session = sessionId 
          ? await ai.loadSession(sessionId, { store })
          : await ai.createSession({ store });
      
      sessionId = session.id;
      console.log(`DEBUG: Session ready. ID: ${sessionId}`);

      console.log('DEBUG: Fetching persona prompt...');
      const personaInstruction = await getPersonaPrompt(persona || 'neutral');
      const systemPrompt = `${personaInstruction} You are an expert AI assistant and a helpful, conversational study partner. Your responses should be well-structured and use markdown for formatting. If you need information from the user to use a tool (like source text for a quiz), and the user does not provide it, you must explain clearly why you need it and suggest ways the user can provide it. When you use a tool, the output will be a structured object. You should then present this information to the user in a clear, readable format.`;
      
      console.log('DEBUG: Configuring model...');
      const model = googleAI.model('gemini-1.5-flash', {
        systemInstruction: systemPrompt,
      });
      
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
      });
      
      const userMessageContent: any[] = [{ text: message }];

      if (context) {
        try {
          const mimeType = context.substring(5, context.indexOf(';'));
          if (mimeType && context.includes('base64,')) {
            userMessageContent.push({ 
              media: { url: context, contentType: mimeType } 
            });
          } else {
            console.warn('DEBUG: Invalid data URI format, skipping media attachment');
          }
        } catch (error) {
          console.error('Error processing context:', error);
        }
      }

      console.log('DEBUG: Sending message to model...');
      const result = await chat.send(userMessageContent, { streamingCallback });
      console.log('DEBUG: Received response from model.');
      
      const toolCalls = result.history.at(-1)?.toolCalls;
      if (toolCalls && toolCalls.length > 0) {
        console.log(`DEBUG: Detected ${toolCalls.length} tool calls.`);
        for (const toolCall of toolCalls) {
          if (toolCall.output) {
              await saveGeneratedContent(userId, toolCall.name, toolCall.output, toolCall.input);
          }
        }
      }

      console.log('--- CHAT FLOW EXECUTION END ---');
      return {
          sessionId,
          response: result.text || "",
      };
      
    } catch (error: any) {
      console.error('--- FATAL ERROR in chatFlow ---');
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
      console.error('---------------------------------');
      throw error;
    }
  }
);
console.log('DEBUG: chatFlow defined successfully.');
