'use server';

/**
 * @fileOverview The main conversational AI flow for the chat interface.
 * It acts as a router, using other specialized AI flows as tools.
 *
 * - chat - The main function for handling chat messages.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  createDiscussionPromptsTool,
  createFlashcardsTool,
  createMemoryAidTool,
  createQuizTool,
  createStudyPlanTool,
  explainConceptTool,
  summarizeNotesTool,
} from './tools';

const PersonaSchema = z.enum(['neutral', 'tutor', 'creative']);
export type Persona = z.infer<typeof PersonaSchema>;

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string(),
});

export const ChatInputSchema = z.object({
  persona: PersonaSchema,
  history: z.array(ChatMessageSchema),
  message: z.string(),
  image: z
    .string()
    .optional()
    .describe(
      "An optional image provided by the student (e.g., a photo of a math problem), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  context: z
    .string()
    .optional()
    .describe(
      'Optional context, like text from a document, to be used by a tool.'
    ),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatOutputSchema = z.object({
  response: z.string().describe("The AI tutor's helpful response."),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

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
