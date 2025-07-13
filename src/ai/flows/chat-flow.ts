
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
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PersonaIDs } from '@/lib/constants';
import { FirestoreSessionStore } from '@/lib/firestore-session-store';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain-community/text_splitters';
import { devVectorStore } from '@genkit-ai/dev-vectorstore';
import { textEmbedding } from 'genkitx-googleai';
import * as pdfjs from 'pdf-parse';

async function getPersonaPrompt(personaId: string): Promise<string> {
  const personaRef = doc(db, 'personas', personaId);
  const personaSnap = await getDoc(personaRef);
  if (personaSnap.exists()) {
    return personaSnap.data().prompt;
  }
  const fallbackRef = doc(db, 'personas', PersonaIDs.NEUTRAL);
  const fallbackSnap = await getDoc(fallbackRef);
  if (fallbackSnap.exists()) {
    return fallbackSnap.data().prompt;
  }
  return 'You are a helpful AI study assistant.';
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
    inputSchema: z.object({
      userId: z.string(),
      message: z.string(),
      sessionId: z.string().optional(),
      persona: z.string().optional(),
      context: z.string().optional(), // This is the data URI for the attachment
    }),
    outputSchema: z.string(),
    stream: true,
  },
  async (input, streamingCallback) => {
    const { userId, message, context, persona } = input;
    let { sessionId } = input;

    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }
    
    const personaInstruction = await getPersonaPrompt(persona || 'neutral');
    const systemPrompt = `${personaInstruction} You are an expert AI assistant. Your responses should be well-structured and use markdown for formatting (e.g., headings, bold text, lists). If you need information from the user to use a tool (like source text for a quiz), and the user does not provide it, you must explain clearly why you need it and suggest ways the user can provide it. Do not try to use a tool without the required information.`;

    const model = ai.model('googleai/gemini-1.5-flash');
    
    // Pass the userId to the store
    const store = new FirestoreSessionStore(userId);
    const chat = await ai.chat({ store, sessionId });
    
    const userMessageContent: any[] = [];

    if (context) {
      const [header, base64Data] = context.split(',');
      const mimeType = header.split(':')[1].split(';')[0];

      if (mimeType.startsWith('image/')) {
        userMessageContent.push({ text: message });
        userMessageContent.push({ media: { url: context, contentType: mimeType } });
      } else {
        const buffer = Buffer.from(base64Data, 'base64');
        let textContent = '';
        if (mimeType === 'application/pdf') {
          const data = await pdfjs(buffer);
          textContent = data.text;
        } else {
          textContent = buffer.toString('utf-8');
        }

        const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 100 });
        const docs = await textSplitter.createDocuments([textContent]);
        
        await devVectorStore.add(docs, {
          embedder: textEmbedding('googleai/text-embedding-004')
        });

        const searchResults = await devVectorStore.query(message, {
          embedder: textEmbedding('googleai/text-embedding-004'),
          k: 3
        });
        
        const retrievedContext = searchResults.map(r => r.text()).join('\n---\n');
        
        const ragPrompt = `CONTEXT FROM FILE:\n${retrievedContext}\n\nBased on the above context, answer the following user request: ${message}`;
        userMessageContent.push({ text: ragPrompt });
      }
    } else {
        userMessageContent.push({ text: message });
    }

    const result = await chat.send(userMessageContent, {
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
      system: systemPrompt,
      streamingCallback,
    });
    
    const toolCalls = result.history.at(-1)?.toolCalls;
    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        if (toolCall.output) {
            await saveGeneratedContent(userId, toolCall.name, toolCall.output, toolCall.input);
        }
      }
    }

    return result.text;
  }
);
