'use server';

import {
  generate,
  prompt,
  defineFlow,
  run,
  configureGenkit,
} from 'genkit/ai';
import {
  ChatHistoryMessage,
  ChatInput,
  Flashcard,
  Quiz,
  StudyPlan,
  Counterarguments,
  PresentationOutline,
  KeyInsights,
  RewriteTextRequest,
  RewriteTextResponse,
  GenerateBulletPointsRequest,
  GenerateBulletPointsResponse,
  GenerateCounterargumentsRequest,
  GenerateCounterargumentsResponse,
  GeneratePresentationOutlineRequest,
  GeneratePresentationOutlineResponse,
  HighlightKeyInsightsRequest,
  HighlightKeyInsightsResponse,
} from './chat-types';
import {ai} from '../genkit';
import {z} from 'zod';
import pdf from 'pdf-parse/lib/pdf-parse';
import { selectModel } from '../model-selection';
import { optimizeChatHistory } from './history-optimizer';
import {
  createDiscussionPromptsTool,
  createFlashcardsTool,
  createMemoryAidTool,
  createQuizTool,
  createStudyPlanTool,
  explainConceptTool,
  generatePresentationOutlineTool,
  highlightKeyInsightsTool,
  summarizeNotesTool,
} from './tools';
import type { Message } from 'genkit';
import { marked } from 'marked';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PersonaIDs } from '@/lib/constants';

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

export async function chat(input: ChatInput) {
  const { userId, message, history, context, image, isPremium, persona } = input;

  const model = selectModel(message, history, isPremium || false);
  const personaInstruction = await getPersonaPrompt(persona);
  const systemPrompt = `${personaInstruction} You are an expert AI assistant and a helpful, conversational study partner.`
  let result;
  
  const availableTools = [
    summarizeNotesTool,
    createStudyPlanTool,
    createFlashcardsTool,
    createQuizTool,
    explainConceptTool,
    createMemoryAidTool,
    createDiscussionPromptsTool,
    generatePresentationOutlineTool,
    highlightKeyInsightsTool,
  ];

  let chatHistory: Message[] = history.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));

  // Optimize the chat history to manage context window and cost
  chatHistory = await optimizeChatHistory(chatHistory);

  const promptParts = [];
  let fullMessage = message;
  // The 'context' is now the raw text content from the file
  if (context) {
    fullMessage = `CONTEXT FROM UPLOADED FILE:\n${context}\n\nUSER'S REQUEST:\n${message}`;
  }
  promptParts.push({ text: fullMessage });

  if (image) {
    // The 'image' field is currently unused in this simplified flow,
    // but is kept for potential future image-specific features.
  }

  result = await ai.generate({
    model,
    system: systemPrompt,
    history: chatHistory,
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

  // After generation, check if a tool was called and save the content
  if (result.toolCalls.length > 0) {
    const toolCall = result.toolCalls[0];
    const toolName = toolCall.name;
    const toolOutput = toolCall.output;
    // Use the original message as the source text for context
    await saveGeneratedContent(userId, toolName, toolOutput, message);
  }

  // Correctly extract the response text from the result object.
  const responseText = result.message?.content?.[0]?.text;

  // Convert markdown to HTML if there is a response.
  const formattedResponse = responseText ? marked(responseText) : 'Sorry, I am not sure how to help with that.';

  return {
    response: formattedResponse,
  };
}
