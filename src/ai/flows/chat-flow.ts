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
import { doc, getDoc, serverTimestamp, collection, addDoc } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase-admin';
import { PersonaIDs } from '@/lib/constants';
import { FirestoreSessionStore } from '@/lib/firestore-session-store';
import { googleAI } from '@genkit-ai/googleai';

async function getPersonaPrompt(personaId: string): Promise<string> {
  try {
    const personaRef = db.collection('personas').doc(personaId);
    const personaSnap = await personaRef.get();
    if (personaSnap.exists) {
      return personaSnap.data()!.prompt;
    }
    
    // Fallback to neutral persona
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

export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.object({
      userId: z.string(),
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
    console.log('DEBUG: chatFlow started with input:', input);
    const { userId, message, context, persona } = input;
    let { sessionId } = input;

    try {
      // Initialize session store
      const store = new FirestoreSessionStore(userId);
      
      // Load existing session or create a new one
      const session = sessionId 
          ? await ai.loadSession(sessionId, { store })
          : await ai.createSession({ store });
      
      sessionId = session.id;
      console.log(`DEBUG: Session loaded/created. ID: ${sessionId}`);

      // Get persona prompt
      const personaInstruction = await getPersonaPrompt(persona || 'neutral');
      const systemPrompt = `${personaInstruction} You are an expert AI assistant and a helpful, conversational study partner. Your responses should be well-structured and use markdown for formatting. If you need information from the user to use a tool (like source text for a quiz), and the user does not provide it, you must explain clearly why you need it and suggest ways the user can provide it. When you use a tool, the output will be a structured object. You should then present this information to the user in a clear, readable format.`;
      
      console.log('DEBUG: Persona prompt fetched.');

      // FIXED: Use systemInstruction in model config instead of system in chat
      const model = googleAI.model('gemini-1.5-flash', {
        systemInstruction: systemPrompt,
      });
      
      const chat = session.chat({
          model,
          // Remove system: systemPrompt from here - this causes the error
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
      
      // Construct user message content
      const userMessageContent: any[] = [{ text: message }];

      // Handle context/media attachment
      if (context) {
        console.log('DEBUG: Processing context attachment...');
        try {
          const mimeType = context.substring(5, context.indexOf(';'));
          console.log('DEBUG: Extracted mime type:', mimeType);
          
          if (mimeType && context.includes('base64,')) {
            userMessageContent.push({ 
              media: { 
                url: context, 
                contentType: mimeType 
              } 
            });
            console.log('DEBUG: Media attachment added successfully');
          } else {
            console.warn('DEBUG: Invalid data URI format, skipping media attachment');
          }
        } catch (error) {
          console.error('DEBUG: Error processing context:', error);
          // Continue without media attachment
        }
      }

      console.log('DEBUG: Sending message to Gemini API...');
      const result = await chat.send(userMessageContent, { streamingCallback });
      console.log('DEBUG: Received response from Gemini API');
      
      // Handle tool calls
      const toolCalls = result.history.at(-1)?.toolCalls;
      if (toolCalls && toolCalls.length > 0) {
        console.log('DEBUG: Processing tool calls...');
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
      
    } catch (error: any) {
      console.error('--- FATAL ERROR in chatFlow ---');
      console.error('Error details:', error);
      console.error('Stack trace:', error.stack);
      console.error('---------------------------------');
      
      // Provide more specific error information
      if (error.message?.includes('system role is not supported')) {
        console.error('DIAGNOSIS: System prompt issue - move to model systemInstruction');
      }
      
      throw error;
    }
  }
);
