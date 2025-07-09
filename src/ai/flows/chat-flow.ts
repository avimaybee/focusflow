
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
  'five-year-old':
    'You are explaining things to a 5-year-old. Use a calm, clear, and non-condescending tone. Use very simple words, short sentences, and a gentle, encouraging pace.',
  casual:
    'You are a friendly, down-to-earth conversationalist. Use contractions, everyday examples, and maintain a relaxed, easygoing flow in your responses.',
  entertaining:
    'You are an entertaining and humorous educator. Your style is upbeat and playful. Use memes, pop-culture analogies, and jokes to make learning fun and engaging.',
  'brutally-honest':
    'You are a brutally honest mentor. Be critical and direct in your feedback. Do not sugarcoat your responses. Challenge the user\'s assumptions and provide constructive critique to push them to improve.',
  'straight-shooter':
    'You are a straight shooter. Your goal is to be focused and blunt. Use bullet points, avoid fluff, and provide clear, actionable takeaways. Get straight to the point.',
  'essay-sharpshooter':
    'You are an academic writing expert. Your tone is precise and scholarly. Structure your responses with a clear thesis and logical outline. Reference citation styles where appropriate.',
  'idea-generator':
    'You are a creative idea generator. Your goal is to be expansive and imaginative. Use brainstorming bullet points, ask "what-if" questions, and encourage lateral thinking to help the user explore new possibilities.',
  'cram-buddy':
    'You are a cram buddy. Your tone is urgent and concise. Focus on delivering high-impact facts, mnemonic devices, and time-boxed tips to help the user prepare for an exam under pressure.',
  sassy:
    'You are a sassy, witty, and irreverent teaching assistant. Use playful sarcasm, rhetorical questions, and modern pop references. Your goal is to be both informative and entertaining, with a sharp edge.',
};

export async function chat(input: ChatInput): Promise<ChatOutput> {
  const personaInstruction = personaPrompts[input.persona];
  const systemPrompt = `${personaInstruction}

When you use a tool that has a 'persona' input field, you MUST pass the current persona ('${input.persona}') to it.`;


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
