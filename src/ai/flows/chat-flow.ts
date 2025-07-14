
'use server';

import { genkit, MessageData } from 'genkit/beta';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';
import { db } from '@/lib/firebase-admin';
import {
  createDiscussionPromptsTool,
  createFlashcardsTool,
  createMemoryAidTool,
  createQuizTool,
  createStudyPlanTool,
  explainConceptTool,
  highlightKeyInsightsTool,
  summarizeNotesTool,
  rewriteTextTool,
  convertToBulletPointsTool,
  generateCounterargumentsTool,
  generatePresentationOutlineTool,
} from '@/ai/tools';
import { FirestoreSessionStore } from '@/lib/firestore-session-store';
import { serverTimestamp } from 'firebase-admin/firestore';
import { ai } from '@/ai/genkit';

/**
 * Fetches the system prompt for a given persona from Firestore.
 * Falls back to a neutral persona if the requested one is not found.
 */
async function getPersonaPrompt(personaId: string): Promise<string> {
  try {
    const personaRef = db.collection('personas').doc(personaId);
    const personaSnap = await personaRef.get();
    if (personaSnap.exists) {
      return personaSnap.data()!.prompt;
    }
    console.warn(`Persona '${personaId}' not found, falling back to neutral.`);
    const fallbackRef = db.collection('personas').doc('neutral');
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

/**
 * Saves the output of a tool call (e.g., a summary, a quiz) to Firestore
 * for the user's persistent "My Content" section.
 */
async function saveGeneratedContent(
  userId: string,
  toolName: string,
  output: unknown,
  toolInput: unknown
) {
  if (!userId || userId === 'guest-user' || !toolName || !output || !toolInput) return;

  let collectionName = '';
  let sourceText = '';

  // Determine which collection to save to based on the tool used
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
      return; // Don't save for other tools
  }

  const data: Record<string, unknown> = {
    userId,
    sourceText: sourceText,
    createdAt: serverTimestamp(),
  };

  // Shape the data according to the tool's output schema
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

/**
 * The main Genkit flow for handling chat interactions.
 * It uses the Genkit Beta session management API for persistent conversations.
 * This flow is optimized for fast, conversational responses.
 */
const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.object({
      userId: z.string(),
      message: z.string(),
      sessionId: z.string().optional(),
      persona: z.string().optional(),
      context: z.string().optional(), // For file uploads as data URIs
    }),
    outputSchema: z.object({
      sessionId: z.string(),
      response: z.string(),
      // Add fields for structured data
      flashcards: z.any().optional(),
      quiz: z.any().optional(),
    }),
  },
  async (input) => {
    const { userId, message, context, persona } = input;
    const isGuest = userId === 'guest-user';
    
    // For guests, we don't use a persistent session store.
    // For logged-in users, we use Firestore for session management.
    const store = isGuest ? undefined : new FirestoreSessionStore(userId);
    
    const session = input.sessionId
      ? await ai.loadSession(input.sessionId, { store })
      : await ai.createSession({ store });
      
    const personaInstruction = await getPersonaPrompt(persona || 'neutral');

    const model = googleAI.model('gemini-1.5-flash');
    console.log('Using light model for conversation/routing: gemini-1.5-flash');

    const systemPrompt = `You are an expert AI assistant and a helpful, conversational study partner. Your responses should be well-structured and use markdown for formatting. If you need information from the user to use a tool (like source text for a quiz), and the user does not provide it, you must explain clearly why you need it and suggest ways the user can provide it. When you use a tool, the output will be a structured object. You should then present this information to the user in a clear, readable format. If you use a tool like createFlashcardsTool or createQuizTool, do not add any additional text to your response, just the tool output.`;

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
        rewriteTextTool,
        convertToBulletPointsTool,
        generateCounterargumentsTool,
        generatePresentationOutlineTool,
      ],
    });
    
    const userMessageContent: (string | { media: { url: string } })[] = [message];
    if (context) {
      userMessageContent.push({ media: { url: context } });
    }
    
    const result = await chat.send(userMessageContent);

    let structuredOutput: { flashcards?: any; quiz?: any } = {};

    // Check the last message for tool calls and extract structured data
    if (result.history && result.history.length > 0) {
      const lastMessage = result.history[result.history.length - 1];
      if (lastMessage.role === 'model' && lastMessage.toolCalls && lastMessage.toolCalls.length > 0) {
        for (const toolCall of lastMessage.toolCalls) {
          if (toolCall.output) {
              // Save generated content for logged-in users
              if (!isGuest) {
                 await saveGeneratedContent(userId, toolCall.name, toolCall.output, toolCall.input);
              }
              // Extract structured output to return to the client
              if (toolCall.name === 'createFlashcardsTool') {
                structuredOutput.flashcards = (toolCall.output as any).flashcards;
              }
              if (toolCall.name === 'createQuizTool') {
                structuredOutput.quiz = (toolCall.output as any).quiz;
              }
          }
        }
      }
    }
    
    return {
      sessionId: session.id,
      response: result.text,
      ...structuredOutput,
    };
  }
);

export { chatFlow };
