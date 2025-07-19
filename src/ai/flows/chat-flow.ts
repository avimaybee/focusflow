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

interface Persona {
    id: string;
    name: string;
    avatarUrl?: string;
    prompt: string;
}

async function getPersona(personaId: string): Promise<Persona> {
  try {
    const personaRef = db.collection('personas').doc(personaId);
    const personaSnap = await personaRef.get();
    if (personaSnap.exists) {
      const data = personaSnap.data();
      return { id: personaSnap.id, ...data } as Persona;
    }
    console.warn(`Persona '${personaId}' not found, falling back to neutral.`);
    const fallbackRef = db.collection('personas').doc('neutral');
    const fallbackSnap = await fallbackRef.get();
    if (fallbackSnap.exists) {
        const data = fallbackSnap.data();
        return { id: fallbackSnap.id, ...data } as Persona;
    }
    return { id: 'neutral', name: 'AI Assistant', avatarUrl: '', prompt: 'You are a helpful AI study assistant.' };
  } catch (error) {
    console.error('Error fetching persona:', error);
    return { id: 'neutral', name: 'AI Assistant', avatarUrl: '', prompt: 'You are a helpful AI study assistant.' };
  }
}

async function saveGeneratedContent(
  userId: string,
  toolName: string,
  output: unknown,
  toolInput: unknown
) {
  if (!userId || userId === 'guest-user' || !toolName || !output || !toolInput) return;

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

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.object({
      userId: z.string(),
      isGuest: z.boolean().optional(),
      message: z.string(),
      sessionId: z.string().optional(),
      personaId: z.string().optional(),
      context: z.object({
          url: z.string(),
          filename: z.string(),
      }).optional(),
    }),
    outputSchema: z.object({
      sessionId: z.string(),
      response: z.string(),
      rawResponse: z.string().optional(),
      flashcards: z.any().optional(),
      quiz: z.any().optional(),
      persona: z.object({
          id: z.string(),
          name: z.string(),
          avatarUrl: z.string().optional(),
          prompt: z.string(),
      }).optional(),
      source: z.object({
          type: z.enum(['file', 'text']),
          name: z.string(),
      }).optional(),
      confidence: z.enum(['high', 'medium', 'low']).optional(),
    }),
  },
  async (input) => {
    const { userId, isGuest, message, context, personaId } = input;
    
    const store = new FirestoreSessionStore(userId, { isGuest });
    
    const session = input.sessionId
      ? await ai.loadSession(input.sessionId, { store })
      : await ai.createSession({ store });
      
    const persona = await getPersona(personaId || 'neutral');

    const model = googleAI.model('gemini-2.5-flash-lite-preview-06-17');

    // The persona's prompt is the core of the system instruction.
    const systemPrompt = `${persona.prompt}

**Response Guidelines:**
1.  **Structure is Key:** Use Markdown extensively for formatting. Use headings ('##', '###'), bold text, italics, lists (bulleted and numbered), and code blocks to make the information easy to digest.
2.  **Tool Interaction:**
    *   If you need information from the user to use a tool (like source text for a quiz), you must explain clearly why you need it and suggest ways the user can provide it.
    *   When you use a tool, the output will be a structured object. You should then present this information to the user in a clear, readable format.
    *   If you use a tool like 'createFlashcardsTool' or 'createQuizTool', do not add any additional text to your response, just the tool output.`;

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
      auth: { uid: userId },
    });
    
    const userMessageContent: (string | { media: { url: string } })[] = [message];
    if (context) {
      userMessageContent.push({ media: { url: context.url } });
    }
    
    const result = await chat.send(userMessageContent);

    let structuredOutput: { flashcards?: any; quiz?: any } = {};
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    let source: { type: 'file' | 'text'; name: string } | undefined = undefined;

    if (context) {
        confidence = 'high';
        source = { type: 'file', name: context.filename };
    }

    if (result.history && result.history.length > 0) {
      const lastMessage = result.history[result.history.length - 1];
      if (lastMessage.role === 'model' && lastMessage.toolCalls && lastMessage.toolCalls.length > 0) {
        confidence = 'high';
        for (const toolCall of lastMessage.toolCalls) {
          if (toolCall.output) {
              if (!isGuest) {
                 await saveGeneratedContent(userId, toolCall.name, toolCall.output, toolCall.input);
              }
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

    // Add source and confidence to the last model message
    if (result.history) {
        const lastModelMessage = result.history.slice().reverse().find(m => m.role === 'model');
        if (lastModelMessage) {
            lastModelMessage.data = {
                ...lastModelMessage.data,
                source,
                confidence,
                persona,
            };
        }
    }
    
    return {
      sessionId: session.id,
      response: result.text,
      rawResponse: result.text,
      source,
      confidence,
      persona,
      ...structuredOutput,
    };
  }
);

export { chatFlow };
