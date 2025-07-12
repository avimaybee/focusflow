
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
import type { Message } from 'genkit';
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

    const lastMessage = history[history.length - 1];
    const prompt = lastMessage?.text || message; // Fallback to original message if history is empty
    const otherHistory = history.slice(0, -1);


    const llmHistory: Message[] = otherHistory.map(m => ({
        role: m.role,
        content: [{text: m.text}],
    }));
    const optimizedHistory = await optimizeChatHistory(llmHistory);

    const promptParts = [];
    
    if (context) {
      const isDataUri = context.startsWith('data:');
      if (isDataUri) {
        const [header, base64Data] = context.split(',');
        const mimeType = header.split(':')[1].split(';')[0];

        if (mimeType === 'application/pdf') {
          const { parsePdfToText } = await import('@/ai/pdf-parser');
          const { summarizeTextMapReduce } = await import('@/ai/summarizer');

          const pdfBuffer = Buffer.from(base64Data, 'base64');
          const pdfText = await parsePdfToText(pdfBuffer);
          
          if (prompt.toLowerCase().includes('summarize')) {
            const summary = await summarizeTextMapReduce(pdfText);
            promptParts.push({ text: `The user uploaded a PDF and asked for a summary. Here is the summary you generated:\n\n${summary}` });
          } else {
            promptParts.push({ text: `CONTEXT FROM UPLOADED PDF:\n${pdfText}\n\nUSER'S REQUEST:\n${prompt}` });
          }
        } else if (mimeType.startsWith('image/')) {
          promptParts.push({ text: `CONTEXT FROM UPLOADED IMAGE:\nUse the content of the following image to answer the request.` });
          promptParts.push({ media: { url: context } });
          promptParts.push({ text: `\n\nUSER'S REQUEST:\n${prompt}` });
        } else {
           const textContent = Buffer.from(base64Data, 'base64').toString('utf-8');
           promptParts.push({ text: `CONTEXT FROM UPLOADED FILE:\n${textContent}\n\nUSER'S REQUEST:\n${prompt}` });
        }
      } else {
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
      history: optimizedHistory,
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

    const choices = result.candidates;
    if (choices[0].finishReason !== 'stop' && choices[0].finishReason !== 'other') {
        // Handle cases where generation was blocked or stopped for other reasons
    }

    if (choices[0].toolCalls && choices[0].toolCalls.length > 0) {
      const toolCall = choices[0].toolCalls[0];
      const toolName = toolCall.name;
      const toolOutput = toolCall.output;
      await saveGeneratedContent(userId, toolName, toolOutput, prompt);
    }

    const responseText = result.text() || 'Sorry, I am not sure how to help with that.';
    const formattedResponse = marked(responseText);

    return {
      response: formattedResponse,
      rawResponse: responseText,
    };
  }
);
