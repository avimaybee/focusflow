
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';
import { db } from '@/lib/firebase-admin';
import { serverTimestamp } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
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
import { MessageData } from 'genkit/beta';

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
      context: z.string().optional(),
    }),
    outputSchema: z.object({
      sessionId: z.string(),
      response: z.string(),
    }),
  },
  async (input) => {
    const { userId, message, context, persona } = input;
    let { sessionId } = input;
    
    // 1. Determine Session ID and Reference
    if (!sessionId) {
      sessionId = uuidv4();
    }
    const sessionRef = db.collection('users').doc(userId).collection('chats').doc(sessionId);

    // 2. Load and validate History if it exists
    let history: MessageData[] = [];
    if (input.sessionId) {
      const chatSnap = await sessionRef.get();
      if (chatSnap.exists()) {
        const storedHistory = chatSnap.data()?.history || [];
        // Defensively map the history to the required format
        history = storedHistory.map((msg: any) => {
          if (!msg.content || !Array.isArray(msg.content)) {
            // If the message is malformed, skip it.
            return null;
          }
          const textPart = msg.content.find((p: any) => p.text);
          const mediaPart = msg.content.find((p: any) => p.media);
          
          if (!textPart && !mediaPart) {
             // Skip if no valid content part is found
            return null;
          }

          return {
            role: msg.role,
            content: msg.content,
          };
        }).filter((item: MessageData | null): item is MessageData => item !== null); // Filter out nulls
      }
    }
    
    // 3. Get persona instruction
    const personaInstruction = await getPersonaPrompt(persona || 'neutral');
    
    // 4. Construct the model with system prompt and tools
    const model = googleAI.model('gemini-1.5-flash');

    const systemPrompt = `${personaInstruction} You are an expert AI assistant and a helpful, conversational study partner. Your responses should be well-structured and use markdown for formatting. If you need information from the user to use a tool (like source text for a quiz), and the user does not provide it, you must explain clearly why you need it and suggest ways the user can provide it. When you use a tool, the output will be a structured object. You should then present this information to the user in a clear, readable format.`;
      
    // 5. Prepare user message with optional context
    const userMessageContent: any[] = [{ text: message }];
    if (context) {
      userMessageContent.push({ media: { url: context } });
    }
    
    // 6. Generate the AI response
    const result = await ai.generate({
      model,
      history: [...history, { role: 'user', content: userMessageContent }],
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
      ],
      output: {
        format: 'text',
      },
    });
    
    // 7. Extract the final AI response and prepare the new history
    const aiResponse = result.history[result.history.length-1];
    const newHistory = [...history, { role: 'user', content: userMessageContent }, aiResponse];
    
    // 8. Save updated history and metadata back to Firestore
    await sessionRef.set({
        id: sessionId,
        userId: userId,
        history: newHistory,
        updatedAt: serverTimestamp(),
        title: message.substring(0, 50),
    }, { merge: true });

    // 9. Handle and save tool call outputs
    const toolCalls = aiResponse.toolCalls;
    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        if (toolCall.output) {
            await saveGeneratedContent(userId, toolCall.name, toolCall.output, toolCall.input);
        }
      }
    }
    
    // 10. Return the result
    return {
      sessionId,
      response: result.text,
    };
  }
);
