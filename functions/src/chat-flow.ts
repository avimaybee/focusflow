'use server';

import { ai } from './genkit';
import { z } from 'zod';
import { marked } from 'marked';
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
import { ChatInput, Persona, validPersonas } from '@/types/chat-types';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PersonaIDs } from '@/lib/constants';
import { Message } from 'genkit/beta';

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
    
    // In the future, we can select a model based on the request.
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

    // Build the history for the AI model
    const historyForAI: Message[] = history.reduce((acc: Message[], m) => {
      if (m && m.role && m.text) {
        acc.push({
          role: m.role,
          content: [{ text: m.text }],
        });
      }
      return acc;
    }, []);

    const userMessageContent = { role: 'user', content: [{ text: message }] } as Message;

    // Handle file context
    if (context) {
        const isDataUri = context.startsWith('data:');
        if (isDataUri) {
            const [header, base64Data] = context.split(',');
            const mimeType = header.split(':')[1].split(';')[0];
            if (mimeType.startsWith('image/')) {
                 userMessageContent.content.push({ media: { url: context, contentType: mimeType } });
            } else {
                // For non-image files, we prepend the text content to the user's message
                let textContent = '';
                const buffer = Buffer.from(base64Data, 'base64');
                if (mimeType === 'application/pdf') {
                    const { parse } = await import('pdf-parse/lib/pdf-parse.js');
                    const pdfData = await parse(buffer);
                    textContent = pdfData.text;
                } else {
                    textContent = buffer.toString('utf-8');
                }
                 userMessageContent.content[0].text = `CONTEXT FROM UPLOADED FILE:\n${textContent}\n\nUSER'S REQUEST:\n${message}`;
            }
        } else {
             userMessageContent.content[0].text = `CONTEXT:\n${context}\n\nUSER'S REQUEST:\n${message}`;
        }
    }

    historyForAI.push(userMessageContent);

    try {
      const result = await ai.generate({
        model,
        system: systemPrompt,
        history: historyForAI,
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
        throw new Error('AI model did not return a response.');
      }

      if (choices[0].finishReason !== 'stop' && choices[0].finishReason !== 'other') {
          // Handle cases where generation was blocked or stopped for other reasons
          console.warn(`AI response stopped due to: ${choices[0].finishReason}`);
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

    } catch (error: any) {
      console.error('Error in ai.generate:', error);
      const errorMessage = error.message.includes('SAFETY') 
          ? 'Sorry, the response was blocked by a safety filter. Please try rephrasing your request.'
          : 'Sorry, there was an error processing your request. Please try again.';
      
      return {
        response: errorMessage,
        rawResponse: errorMessage,
        isError: true,
      };
    }
  }
);
