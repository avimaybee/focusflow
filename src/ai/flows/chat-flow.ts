
'use server';

import {
  ChatHistoryMessage,
  ChatInput,
} from './chat-types';
import {ai} from '../genkit';
import { selectModel } from '../model-selection';
import { optimizeChatHistory } from './history-optimizer';
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
import type { Message } from 'genkit';
import { marked } from 'marked';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PersonaIDs } from '@/lib/constants';
import { rewriteTextFlow } from './rewrite-text';
import { generateBulletPointsFlow } from './generate-bullet-points';
import { generateCounterargumentsFlow } from './generate-counterarguments';
import { highlightKeyInsightsFlow as highlightKeyInsightsFlowFn } from './highlight-key-insights'; // Renamed to avoid conflict
import {
  RewriteTextRequest,
  GenerateBulletPointsRequest,
  GenerateCounterargumentsRequest,
  HighlightKeyInsightsRequest,
} from './chat-types';
import { z } from 'zod';

async function getPersonaPrompt(personaId: string): Promise<string> {
    const personaRef = doc(db, 'personas', personaId);
    const personaSnap = await getDoc(personaRef);
    if (personaSnap.exists()) {
        return personaSnap.data().prompt;
    }
    // Fallback to a neutral prompt if the persona is not found
    const fallbackRef = doc(db, 'personas', PersonaIDs.NEUTRAL);
    const fallbackSnap = await getDoc(fallbackRef);
    if (fallbackSnap.exists()) {
        return fallbackSnap.data().prompt;
    }
    return 'You are a helpful AI study assistant. Your tone is knowledgeable, encouraging, and clear. You provide direct and effective help without a strong personality. Your goal is to be a reliable and straightforward academic tool.';
}

async function saveGeneratedContent(userId: string, toolName: string, output: any, source: string) {
  if (!userId || !toolName || !output) return;

  let collectionName = '';
  let data: any = {
    sourceText: source,
    createdAt: serverTimestamp(),
  };

  switch (toolName) {
    case 'summarizeNotesTool':
      collectionName = 'summaries';
      data.title = output.title || 'Summary';
      data.summary = output.summary;
      data.keywords = output.keywords;
      break;
    case 'createFlashcardsTool':
      collectionName = 'flashcardSets';
      data.title = `Flashcards for: ${source.substring(0, 40)}...`;
      data.flashcards = output.flashcards;
      break;
    case 'createQuizTool':
      collectionName = 'quizzes';
      data.title = output.title || `Quiz for: ${source.substring(0, 40)}...`;
      data.quiz = output.quiz;
      break;
    case 'createStudyPlanTool':
        collectionName = 'studyPlans';
        data.title = output.title || 'New Study Plan';
        data.plan = output.plan;
        break;
    default:
      return; // Don't save for tools that don't generate persistent content
  }

  try {
    const contentCollection = collection(db, 'users', userId, collectionName);
    await addDoc(contentCollection, data);
    console.log(`Saved ${collectionName} for user ${userId}`);
  } catch (error) {
    console.error(`Error saving ${collectionName} to Firestore:`, error);
  }
}

export const chat = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.any(),
    outputSchema: z.any(),
  },
  async (input: ChatInput) => {
    const { userId, message, history, context, image, isPremium, persona } = input;

    const model = selectModel(message, history, isPremium || false);
    const personaInstruction = await getPersonaPrompt(persona);
    const systemPrompt = `${personaInstruction} You are an expert AI assistant and a helpful, conversational study partner. Your responses should be well-structured and use markdown for formatting (e.g., headings, bold text, lists) to improve readability. If you need information from the user to use a tool (like source text for a quiz), and the user does not provide it, you must explain clearly why you need it and suggest ways the user can provide it (like pasting text or uploading a file). Do not try to use a tool without the required information.`
    
    const availableTools = [
      summarizeNotesTool,
      createStudyPlanTool,
      createFlashcardsTool,
      createQuizTool,
      explainConceptTool,
      createMemoryAidTool,
      createDiscussionPromptsTool,
      highlightKeyInsightsTool,
    ];

    // The `history` from input already contains the full conversation.
    // The `message` is the text of the most recent message.
    const prompt = message;

    // Convert our ChatHistoryMessage format to Genkit's Message format.
    let chatHistory: Message[] = history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    // Optimize history if it's too long, but exclude the most recent message which is the prompt
    const optimizedHistory = await optimizeChatHistory(chatHistory.slice(0, -1));

    const promptParts = [];

    // The `context` is a Data URI for a file upload.
    if (context) {
      const isDataUri = context.startsWith('data:');
      if (isDataUri) {
        const [header, base64Data] = context.split(',');
        const mimeType = header.split(':')[1].split(';')[0];

        if (mimeType === 'application/pdf') {
          promptParts.push({ text: `CONTEXT FROM UPLOADED PDF:\nUse the content of this PDF to answer the request.` });
          promptParts.push({ media: { url: context } });
          promptParts.push({ text: `\n\nUSER'S REQUEST:\n${prompt}` });
        } else if (mimeType.startsWith('image/')) {
          promptParts.push({ text: `CONTEXT FROM UPLOADED IMAGE:\nUse the content of the following image to answer the request.` });
          promptParts.push({ media: { url: context } });
          promptParts.push({ text: `\n\nUSER'S REQUEST:\n${prompt}` });
        } else {
           const textContent = Buffer.from(base64Data, 'base64').toString('utf-8');
           promptParts.push({ text: `CONTEXT FROM UPLOADED FILE:\n${textContent}\n\nUSER'S REQUEST:\n${prompt}` });
        }
      } else {
        // This case handles plain text context if ever used.
        promptParts.push({ text: `CONTEXT:\n${context}\n\nUSER'S REQUEST:\n${prompt}` });
      }
    } else {
       promptParts.push({ text: prompt });
    }

    if (image) {
      promptParts.push({ media: { url: image } });
    }

    const result = await ai.generate({
      model,
      system: systemPrompt,
      history: optimizedHistory, // Use the optimized history
      prompt: promptParts,
      tools: availableTools,
      toolChoice: 'auto',
      config: {
        safetySettings: [
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
        ],
      },
    });

    if (result.toolCalls && result.toolCalls.length > 0) {
      const toolCall = result.toolCalls[0];
      const toolName = toolCall.name;
      const toolOutput = toolCall.output;
      await saveGeneratedContent(userId, toolName, toolOutput, prompt);
    }

    const responseText = result.message?.content?.[0]?.text || 'Sorry, I am not sure how to help with that.';
    const formattedResponse = marked(responseText);

    return {
      response: formattedResponse,
      rawResponse: responseText,
    };
  }
);


// Re-exposing individual flows for direct use by smart tools
export async function rewriteText(input: z.infer<typeof RewriteTextRequest>) {
  return await rewriteTextFlow(input);
}
export async function generateBulletPoints(input: z.infer<typeof GenerateBulletPointsRequest>) {
  return await generateBulletPointsFlow(input);
}
export async function generateCounterarguments(input: z.infer<typeof GenerateCounterargumentsRequest>) {
  return await generateCounterargumentsFlow(input);
}
export async function highlightKeyInsights(input: z.infer<typeof HighlightKeyInsightsRequest>) {
  return await highlightKeyInsightsFlowFn(input);
}
