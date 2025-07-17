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
      message: z.string(),
      sessionId: z.string().optional(),
      personaId: z.string().optional(),
      context: z.string().optional(),
    }),
    outputSchema: z.object({
      sessionId: z.string(),
      response: z.string(),
      suggestions: z.array(z.string()).optional(),
      rawResponse: z.string().optional(),
      flashcards: z.any().optional(),
      quiz: z.any().optional(),
    }),
  },
  async (input) => {
    const { userId, message, context, personaId } = input;
    const isGuest = userId === 'guest-user';
    
    const store = isGuest ? undefined : new FirestoreSessionStore(userId);
    
    const session = input.sessionId
      ? await ai.loadSession(input.sessionId, { store })
      : await ai.createSession({ store });
      
    const personaInstruction = await getPersonaPrompt(personaId || 'neutral');

    const model = googleAI.model('gemini-1.5-flash');

    const systemPrompt = `${personaInstruction}

**Response Guidelines:**
1.  **Be Thorough:** Always provide in-depth explanations. If a user asks to be taught a topic, break it down into logical sections with clear headings. Use analogies, examples, and step-by-step instructions where appropriate.
2.  **Structure is Key:** Use Markdown extensively for formatting. Use headings ('##', '###'), bold text, italics, lists (bulleted and numbered), and code blocks to make the information easy to digest.
3.  **Anticipate Needs:** If a user asks about a topic, consider what related sub-topics or foundational concepts they might also need to know and include them.
4.  **Tool Interaction:**
    *   If you need information from the user to use a tool (like source text for a quiz), you must explain clearly why you need it and suggest ways the user can provide it.
    *   When you use a tool, the output will be a structured object. You should then present this information to the user in a clear, readable format.
    *   If you use a tool like 'createFlashcardsTool' or 'createQuizTool', do not add any additional text to your response, just the tool output.
**5. Suggest Follow-up Questions:**
    *   After every single response, you MUST provide 3 to 5 relevant, interesting, and insightful follow-up questions that the user might have.
    *   This is not optional. These suggestions should encourage deeper exploration of the topic.
    *   You MUST format these suggestions as a valid JSON array of strings at the absolute end of your response. There should be nothing after this JSON block.
    *   Example format:
    *   {"suggestions": ["What is the Heisenberg Uncertainty Principle?", "How does quantum computing work?", "Who were the key scientists in developing quantum theory?"]}`;

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
      userMessageContent.push({ media: { url: context } });
    }
    
    const result = await chat.send(userMessageContent);

    console.log('[DEBUG: AI Response Text]', result.text);

    let responseText = result.text;
    let suggestions: string[] | undefined = undefined;

    const suggestionsMatch = responseText.match(/\{"suggestions":\s*(\[.*?\])\}/);
    if (suggestionsMatch && suggestionsMatch[1]) {
      try {
        suggestions = JSON.parse(suggestionsMatch[1]);
        responseText = responseText.replace(suggestionsMatch[0], '').trim();
      } catch (e) {
        console.error("Failed to parse suggestions JSON:", e);
      }
    }

    let structuredOutput: { flashcards?: any; quiz?: any } = {};

    if (result.history && result.history.length > 0) {
      const lastMessage = result.history[result.history.length - 1];
      if (lastMessage.role === 'model' && lastMessage.toolCalls && lastMessage.toolCalls.length > 0) {
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
    
    return {
      sessionId: session.id,
      response: responseText,
      suggestions: suggestions,
      rawResponse: result.text,
      ...structuredOutput,
    };
  }
);

export { chatFlow };
