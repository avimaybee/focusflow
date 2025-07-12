
'use server';

import {
  ChatHistoryMessage,
  ChatInput,
} from './chat-types';
import {ai} from '@/ai/genkit';
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
import type { Message, Part } from 'genkit';
import { marked } from 'marked';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PersonaIDs } from '@/lib/constants';
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

export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.any(),
    outputSchema: z.any(),
  },
  async (input: ChatInput) => {
    const { userId, message, history, context, isPremium, persona } = input;

    const model = selectModel(message, history, isPremium || false);
    const personaInstruction = await getPersonaPrompt(persona);
    
    // The system prompt provides overarching instructions for the AI's behavior and persona.
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

    // Convert the chat history from our app's format to Genkit's `Message` format.
    const llmHistory: Message[] = history.map(m => ({
      role: m.role as 'user' | 'model',
      content: [{text: m.text}],
    }));

    // If there's context from a file upload, add it to the latest user message.
    const lastMessage = llmHistory[llmHistory.length - 1];
    if (context && lastMessage?.role === 'user') {
        const isDataUri = context.startsWith('data:');
        if (isDataUri) {
             const [header, base64Data] = context.split(',');
             const mimeType = header.split(':')[1].split(';')[0];
             if (mimeType.startsWith('image/')) {
                 lastMessage.content.push({ media: { url: context } });
             } else {
                // For PDF/text, we prepend text context.
                const { parsePdfToText } = await import('@/ai/pdf-parser');
                const buffer = Buffer.from(base64Data, 'base64');
                const textContent = mimeType === 'application/pdf' ? await parsePdfToText(buffer) : buffer.toString('utf-8');
                lastMessage.content[0].text = `CONTEXT FROM UPLOADED FILE:\n${textContent}\n\nUSER'S REQUEST:\n${lastMessage.content[0].text}`;
             }
        } else {
             lastMessage.content[0].text = `CONTEXT:\n${context}\n\nUSER'S REQUEST:\n${lastMessage.content[0].text}`;
        }
    }
    
    const optimizedHistory = await optimizeChatHistory(llmHistory);

    const result = await ai.generate({
      model,
      system: systemPrompt,
      // The entire conversation, including the latest user message, is passed as history.
      history: optimizedHistory, 
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
      const toolCall = choices[0].toolCalls[0];
      const toolName = toolCall.name;
      const toolOutput = toolCall.output;
      if (userId) {
        await saveGeneratedContent(userId, toolName, message, toolOutput);
      }
    }

    const responseText = result.text() || 'Sorry, I am not sure how to help with that.';
    const formattedResponse = marked(responseText);

    return {
      response: formattedResponse,
      rawResponse: responseText,
    };
  }
);
