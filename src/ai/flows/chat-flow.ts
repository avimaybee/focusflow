
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
    console.log(`DEBUG: Fetching persona prompt for ID: ${personaId}`);
    const personaRef = db.collection('personas').doc(personaId);
    const personaSnap = await personaRef.get();
    
    if (personaSnap.exists) {
      console.log('DEBUG: Persona found, returning custom prompt');
      return personaSnap.data()!.prompt;
    }
    
    console.log('DEBUG: Persona not found, trying fallback...');
    const fallbackRef = db.collection('personas').doc(PersonaIDs.NEUTRAL);
    const fallbackSnap = await fallbackRef.get();
    
    if (fallbackSnap.exists) {
      console.log('DEBUG: Fallback persona found');
      return fallbackSnap.data()!.prompt;
    }
    
    console.log('DEBUG: No persona found, using default prompt');
    return 'You are a helpful AI study assistant.';
  } catch (error) {
    console.error('ERROR: Failed to fetch persona prompt:', error);
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
    console.log(`DEBUG: Saved ${collectionName} for user ${userId}`);
  } catch (error) {
    console.error(`ERROR: Failed to save ${collectionName} to Firestore:`, error);
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
    console.log('=== DEBUG: chatFlow started ===');
    console.log('Input:', JSON.stringify(input, null, 2));
    
    const { userId, message, context, persona } = input;
    let { sessionId } = input;

    try {
      // Step 1: Validate inputs
      console.log('DEBUG: Step 1 - Validating inputs...');
      if (!userId || !message) {
        throw new Error('Missing required fields: userId or message');
      }

      // Step 2: Initialize session store
      console.log('DEBUG: Step 2 - Initializing session store...');
      const store = new FirestoreSessionStore(userId);
      console.log('DEBUG: Session store created successfully');

      // Step 3: Load or create session
      console.log('DEBUG: Step 3 - Loading/creating session...');
      console.log('DEBUG: sessionId provided:', sessionId);
      
      let session;
      if (sessionId) {
        console.log('DEBUG: Loading existing session...');
        session = await ai.loadSession(sessionId, { store });
        console.log('DEBUG: Existing session loaded successfully');
      } else {
        console.log('DEBUG: Creating new session...');
        session = await ai.createSession({ store });
        console.log('DEBUG: New session created successfully');
      }
      
      sessionId = session.id;
      console.log(`DEBUG: Final session ID: ${sessionId}`);

      // Step 4: Get persona prompt
      console.log('DEBUG: Step 4 - Fetching persona prompt...');
      const personaInstruction = await getPersonaPrompt(persona || 'neutral');
      console.log('DEBUG: Persona instruction length:', personaInstruction.length);

      // Step 5: Create system prompt
      console.log('DEBUG: Step 5 - Creating system prompt...');
      const systemPrompt = `${personaInstruction} You are an expert AI assistant and a helpful, conversational study partner. Your responses should be well-structured and use markdown for formatting. If you need information from the user to use a tool (like source text for a quiz), and the user does not provide it, you must explain clearly why you need it and suggest ways the user can provide it. When you use a tool, the output will be a structured object. You should then present this information to the user in a clear, readable format.`;
      console.log('DEBUG: System prompt created, length:', systemPrompt.length);

      // Step 6: Create model with system instruction
      console.log('DEBUG: Step 6 - Creating model...');
      const model = googleAI.model('gemini-1.5-flash', {
        systemInstruction: systemPrompt,
      });
      console.log('DEBUG: Model created successfully');

      // Step 7: Create chat with session
      console.log('DEBUG: Step 7 - Creating chat...');
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
      console.log('DEBUG: Chat created successfully');

      // Step 8: Prepare message content
      console.log('DEBUG: Step 8 - Preparing message content...');
      const userMessageContent: any[] = [{ text: message }];
      console.log('DEBUG: Base message content prepared');

      // Handle context if provided
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
        }
      }

      console.log('DEBUG: Final message content structure:', JSON.stringify(userMessageContent.map(item => ({
        ...item,
        media: item.media ? { contentType: item.media.contentType, urlLength: item.media.url?.length } : undefined
      })), null, 2));

      // Step 9: Send message to Gemini
      console.log('DEBUG: Step 9 - Sending message to Gemini API...');
      console.log('DEBUG: Message text:', message);
      console.log('DEBUG: Has context:', !!context);
      console.log('DEBUG: StreamingCallback provided:', !!streamingCallback);
      
      const result = await chat.send(userMessageContent, { streamingCallback });
      console.log('DEBUG: Received response from Gemini API');
      console.log('DEBUG: Response text length:', result.text?.length || 0);

      // Step 10: Handle tool calls
      console.log('DEBUG: Step 10 - Checking for tool calls...');
      const toolCalls = result.history.at(-1)?.toolCalls;
      if (toolCalls && toolCalls.length > 0) {
        console.log(`DEBUG: Processing ${toolCalls.length} tool calls...`);
        for (const toolCall of toolCalls) {
          console.log(`DEBUG: Tool call: ${toolCall.name}`);
          if (toolCall.output) {
              await saveGeneratedContent(userId, toolCall.name, toolCall.output, toolCall.input);
          }
        }
      } else {
        console.log('DEBUG: No tool calls found');
      }

      // Step 11: Return result
      console.log('DEBUG: Step 11 - Returning result...');
      const finalResult = {
          sessionId,
          response: result.text || '',
      };
      console.log('DEBUG: Final result structure:', {
        sessionId: finalResult.sessionId,
        responseLength: finalResult.response.length
      });

      console.log('=== DEBUG: chatFlow completed successfully ===');
      return finalResult;
      
    } catch (error: any) {
      console.error('=== FATAL ERROR in chatFlow ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Log additional error details
      if (error.code) {
        console.error('Error code:', error.code);
      }
      if (error.status) {
        console.error('Error status:', error.status);
      }
      if (error.details) {
        console.error('Error details:', error.details);
      }
      
      // Check for specific error patterns
      if (error.message?.includes('system role is not supported')) {
        console.error('DIAGNOSIS: System role error - this should be fixed with systemInstruction');
      }
      if (error.message?.includes('quota')) {
        console.error('DIAGNOSIS: Quota exceeded - check your API limits');
      }
      if (error.message?.includes('authentication')) {
        console.error('DIAGNOSIS: Authentication error - check your API keys');
      }
      if (error.message?.includes('PERMISSION_DENIED')) {
        console.error('DIAGNOSIS: Permission denied - check Firebase rules');
      }
      
      console.error('=== END ERROR DETAILS ===');
      
      // Re-throw with more context
      throw new Error(`ChatFlow error: ${error.message || 'Unknown error'}`);
    }
  }
);

    