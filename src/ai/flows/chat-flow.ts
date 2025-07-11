
import { ai } from '@/ai/genkit';
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
import type { ChatInput, ChatOutput } from './chat-types';
import type { Message } from 'genkit';
import { z } from 'zod';
import { marked } from 'marked';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PersonaIDs } from '@/lib/constants';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import pdf from 'pdf-parse';

// Ensure Firebase Admin is initialized only once
let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp();
} else {
  adminApp = getApps()[0];
}

async function getFileContent(gsPath: string): Promise<string | undefined> {
  if (!gsPath || !gsPath.startsWith('gs://')) {
    return undefined;
  }
  console.log(`Processing file from: ${gsPath}`);
  const bucket = getStorage(adminApp).bucket();
  const file = bucket.file(gsPath.replace(`gs://${bucket.name}/`, ''));
  
  try {
    const [buffer] = await file.download();
    const metadata = await file.getMetadata();
    const contentType = metadata[0].contentType || '';

    if (contentType.includes('pdf')) {
      const data = await pdf(buffer);
      return data.text;
    } else if (contentType.startsWith('text/')) {
      return buffer.toString('utf-8');
    } else {
      console.warn(`Unsupported content type: ${contentType}`);
      return undefined;
    }
  } catch (error) {
    console.error(`Failed to download or parse file from ${gsPath}:`, error);
    return undefined;
  }
}

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

export async function chat(input: ChatInput): Promise<ChatOutput> {
  const { userId, message, history, context, image, isPremium, persona } = input;

  const model = selectModel(message, history, isPremium || false);
  const personaInstruction = await getPersonaPrompt(persona);
  const systemPrompt = `${personaInstruction} You are an expert AI assistant and a helpful, conversational study partner.`;
  let result;

  // Get file content if context (gsPath) is provided
  const fileContent = await getFileContent(context || '');

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
  if (fileContent) {
    fullMessage = `CONTEXT FROM UPLOADED FILE:\n${fileContent}\n\nUSER'S REQUEST:\n${message}`;
  }
  promptParts.push({ text: fullMessage });

  if (image) {
    promptParts.push({ media: { url: image } });
  }

  result = await ai.generate({
    model,
    system: systemPrompt,
    history: chatHistory,
    prompt: promptParts,
    tools: availableTools,
    toolChoice: 'auto',
    // Note: The 'context' parameter for ai.generate is different from our app's context.
    // We are manually prepending the file content to the prompt.
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
