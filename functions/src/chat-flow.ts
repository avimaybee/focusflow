'use server';

import {
  ChatHistoryMessage,
  ChatInput,
} from './chat-types';
import {ai} from '@/functions/src/genkit';
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
import { z } from 'zod';
import * as admin from 'firebase-admin';


async function getPersonaPrompt(personaId: string): Promise<string> {
    const personaRef = admin.firestore().collection('personas').doc(personaId);
    const personaSnap = await personaRef.get();
    if (personaSnap.exists) {
        return personaSnap.data()?.prompt;
    }
    // Fallback to a neutral prompt if the persona is not found
    const fallbackRef = admin.firestore().collection('personas').doc(PersonaIDs.NEUTRAL);
    const fallbackSnap = await fallbackRef.get();
    if (fallbackSnap.exists()) {
        return fallbackSnap.data()?.prompt;
    }
    return 'You are a helpful AI study assistant. Your tone is knowledgeable, encouraging, and clear. You provide direct and effective help without a strong personality. Your goal is to be a reliable and straightforward academic tool.';
}

async function saveGeneratedContent(userId: string, toolName: string, output: any, source: string) {
  if (!userId || !toolName || !output) return;

  const firestore = admin.firestore();
  let collectionName = '';
  let data: any = {
    sourceText: source,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
    const contentCollection = firestore.collection('users').doc(userId).collection(collectionName);
    await contentCollection.add(data);
    console.log(`Saved ${collectionName} for user ${userId}`);
  } catch (error) {
    console.error(`Error saving ${collectionName} to Firestore:`, error);
  }
}

export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.any(),
    outputSchema: z.any(),
  },
  async (input: ChatInput) => {
    const { userId, message, history, context, isPremium, persona } = input;

    // Use a simple model for now
    const model = 'googleai/gemini-1.5-flash';
    const personaInstruction = await getPersonaPrompt(persona);
    
    const systemPrompt = `${personaInstruction} You are an expert AI assistant and a helpful, conversational study partner. Your responses should be well-structured and use markdown for formatting (e.g., headings, bold text, lists) to improve readability. If you need information from the user to use a tool (like source text for a quiz), and the user does not provide it, you must explain clearly why you need it and suggest ways the user can provide it (like pasting text or uploading a file). Do not try to use a tool without the required information.`;

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

    const llmHistory: Message[] = [];
    
    if (history && Array.isArray(history)) {
      for (const m of history) {
        if (m && m.role && m.text) {
          llmHistory.push({
            role: m.role as 'user' | 'model',
            content: [{ text: m.text }],
          });
        }
      }
    }

    if (message && message.trim()) {
      llmHistory.push({
        role: 'user',
        content: [{ text: message }],
      });
    }

    const lastMessage = llmHistory[llmHistory.length - 1];
    if (context && lastMessage?.role === 'user' && lastMessage.content && lastMessage.content.length > 0) {
        const isDataUri = context.startsWith('data:');
        if (isDataUri) {
             const [header, base64Data] = context.split(',');
             const mimeType = header.split(':')[1].split(';')[0];
             if (mimeType.startsWith('image/')) {
                 lastMessage.content.push({ media: { url: context, contentType: mimeType } });
             }
        }
    }

    const finalHistory = await optimizeChatHistory(llmHistory);

    try {
      const result = await ai.generate({
        model,
        system: systemPrompt,
        history: finalHistory, 
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

      const choices = result.candidates;
      
      if (!choices || choices.length === 0) {
        const errorMessage = 'Sorry, the AI model did not return a response. This could be due to a safety filter or a temporary issue. Please try rephrasing your request.';
        return {
          response: errorMessage,
          rawResponse: errorMessage,
        };
      }

      if (choices[0].finishReason !== 'stop' && choices[0].finishReason !== 'other') {
          // Handle cases where generation was blocked or stopped for other reasons
      }

      if (choices[0].toolCalls && choices[0].toolCalls.length > 0) {
        for (const toolCall of choices[0].toolCalls) {
            const toolName = toolCall.name;
            // The tool output is automatically provided back to the model in the next turn
            // but we can also save it if needed.
            if (toolCall.output && userId) {
                await saveGeneratedContent(userId, toolName, toolCall.output, message);
            }
        }
      }

      const responseText = result.text() || 'Sorry, I am not sure how to help with that.';
      const formattedResponse = marked(responseText);

      return {
        response: formattedResponse,
        rawResponse: responseText,
      };
    } catch (error) {
      console.error('Error in ai.generate:', error);
      
      const errorMessage = 'Sorry, there was an error processing your request. Please try again.';
      return {
        response: errorMessage,
        rawResponse: errorMessage,
      };
    }
  }
);
