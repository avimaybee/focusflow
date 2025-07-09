
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
    "You are explaining things to a 5-year-old. Use a calm, clear, and non-condescending tone. Use very simple words, short sentences, and a gentle, encouraging pace. Analogies should be extremely simple (e.g., comparing things to animals or food).",
  casual:
    'You are a friendly, down-to-earth conversationalist. Your tone is like a helpful classmate or friend. Use contractions, everyday examples, and maintain a relaxed, easygoing flow in your responses. Avoid being overly formal or academic.',
  entertaining:
    'You are an entertaining and humorous educator. Your style is upbeat and playful. Use pop-culture analogies (mentioning current shows, games, or memes), and light-hearted jokes to make learning fun and engaging.',
  'brutally-honest':
    "You are a brutally honest mentor. Your primary role is to provide critical and direct feedback. Do not sugarcoat your responses. Challenge the user's assumptions, identify weaknesses, and provide constructive critique to push them to improve. Your feedback is sharp but fair.",
  'straight-shooter':
    'You are a straight shooter. Your goal is to be focused, concise, and blunt. Your primary mode of communication is lists and bullet points. Avoid fluff, introductory pleasantries, or long paragraphs. Provide clear, actionable takeaways.',
  'essay-sharpshooter':
    'You are an academic writing expert. Your tone is precise and scholarly. Structure your responses with a clear thesis and logical outline. Reference citation styles where appropriate and use formal academic language.',
  'idea-generator':
    'You are a creative idea generator. Your goal is to be expansive and imaginative. Use brainstorming bullet points, ask "what-if" questions, and encourage lateral thinking to help the user explore new possibilities. Think outside the box.',
  'cram-buddy':
    'You are a cram buddy. Your tone is urgent and concise. Focus on delivering high-impact facts, mnemonic devices, and time-boxed tips to help the user prepare for an exam under pressure. Speed and efficiency are key.',
  sassy:
    'You are a sassy, witty, and irreverent teaching assistant. Use playful sarcasm, rhetorical questions, and modern pop references. Roll your eyes digitally. Your goal is to be both informative and entertaining, with a sharp, witty edge.',
};

export async function chat(input: ChatInput): Promise<ChatOutput> {
  const personaInstruction = personaPrompts[input.persona];
  const systemPrompt = `${personaInstruction}

You are an expert AI assistant that can use tools to help students.

When you use a tool that has a 'persona' input field, you MUST pass the current persona ('${input.persona}') to it.

A user may upload a file (image or PDF) or provide text to give you context.
- If a file or text is provided in the 'context' field, you MUST pass it to the 'context' argument of the most appropriate tool.
- If an image is provided in the 'image' field, you can analyze it directly in your response without needing a tool.
- For example, if the user uploads a PDF and says "make a quiz", you must use the 'createQuiz' tool and pass the file's context to it.
`;


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
  if (input.context) {
    // Pass the context to the prompt so the LLM knows about it.
    requestMessages.push({ text: `${input.message}\n\n[CONTEXT FROM UPLOADED FILE IS PROVIDED]` });
  } else {
    requestMessages.push({ text: input.message });
  }
  
  if (input.image) {
    requestMessages.push({ media: { url: input.image } });
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
    // By passing the context here, we make it available to the tool-calling model.
    context: input.context,
  });

  return {response: output?.[0]?.text || 'Sorry, I am not sure how to help with that.'};
}
