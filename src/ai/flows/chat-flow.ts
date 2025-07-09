'use server';

/**
 * @fileOverview The main conversational AI flow for the chat interface.
 * It acts as a router, using other specialized AI flows as tools.
 *
 * - chat - The main function for handling chat messages.
 */
import {ai} from '@/ai/genkit';
import {
  createDiscussionPromptsTool,
  createFlashcardsTool,
  createMemoryAidTool,
  createQuizTool,
  createStudyPlanTool,
  explainConceptTool,
  summarizeNotesTool,
} from './tools';
import type { ChatInput, ChatOutput } from './chat-types';

const personaPrompts = {
  neutral:
    'You are a helpful AI study assistant. You are friendly, knowledgeable, and encouraging. Your goal is to help the student learn effectively.',
  tutor:
    'You are an expert Academic Tutor. You are formal, precise, and focus on deep understanding. Challenge the student with insightful questions and provide clear, structured explanations.',
  creative:
    'You are an inspiring Creative Coach. You are enthusiastic, imaginative, and use analogies and vivid descriptions. Encourage brainstorming and innovative thinking.',
};

export async function chat(input: ChatInput): Promise<ChatOutput> {
  const systemPrompt = personaPrompts[input.persona];

  const tools = [
    summarizeNotesTool,
    createStudyPlanTool,
    createFlashcardsTool,
    createQuizTool,
    explainConceptTool,
    createMemoryAidTool,
    createDiscussionPromptsTool,
  ];

  const history = input.history.map(msg => ({
    role: msg.role,
    content: [{text: msg.text}],
  }));

  const requestMessages = [];
  if (input.image) {
    requestMessages.push({ text: input.message }, { media: { url: input.image } });
  } else {
    requestMessages.push({ text: input.message });
  }


  const {output} = await ai.generate({
    model: 'googleai/gemini-2.0-flash',
    system: systemPrompt,
    tools,
    history,
    prompt: requestMessages,
    config: {
      safetySettings: [
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE',
        },
      ],
    },
  });

  return {response: output?.[0]?.text || 'Sorry, I am not sure how to help with that.'};
}
