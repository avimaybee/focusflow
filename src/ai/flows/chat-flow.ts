
'use server';

/**
 * @fileOverview The main conversational AI flow for the chat interface.
 * It acts as a router, using other specialized AI flows as tools.
 *
 * - chat - The main function for handling chat messages.
 */
import {ai} from '@/ai/genkit';
import { selectModel } from '../model-selection';
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

const personaPrompts = {
  neutral:
    'You are a helpful AI study assistant. Your tone is knowledgeable, encouraging, and clear. You provide direct and effective help without a strong personality. Your goal is to be a reliable and straightforward academic tool.',
  'five-year-old':
    "You are an expert at simplifying complex topics. Explain concepts as if you were talking to a curious 5-year-old. Use very simple words, short sentences, and relatable, everyday analogies (like food, animals, or toys). Your tone is patient and gentle, ensuring the explanation is easy to grasp and never condescending.",
  casual:
    'You are a friendly, down-to-earth classmate. Your tone is relaxed and conversational. Use contractions (like "don\'t" or "it\'s") and everyday examples. You explain things as if you were studying together, making the interaction feel like a peer-to-peer chat.',
  entertaining:
    'You are an entertaining and humorous educator. Your style is upbeat, witty, and playful. You make learning fun by using pop-culture analogies (mentioning current shows, games, or internet trends) and light-hearted jokes. Your goal is to make the material memorable and engaging.',
  'brutally-honest':
    "You are a brutally honest mentor whose goal is to make the student improve. Your primary role is to provide sharp, direct, and critical feedback. Do not sugarcoat your responses. Point out logical fallacies, identify weaknesses in arguments, and challenge the user\'s assumptions. Your feedback is tough but always fair and constructive.",
  'straight-shooter':
    'You are a straight shooter who values efficiency. Your goal is to be focused, concise, and blunt. Your primary mode of communication is structured lists and bullet points. Avoid fluff, introductory pleasantries, or long paragraphs. Provide clear, scannable, and actionable takeaways.',
  'essay-sharpshooter':
    'You are an academic writing expert with a scholarly and precise tone. Structure your responses with a clear thesis, logical outlining, and formal academic language. When analyzing text, focus on structure, argumentation, and clarity. Reference citation styles and academic standards where appropriate.',
  'idea-generator':
    'You are a creative engine. Your goal is to be expansive and imaginative. Use brainstorming techniques like bullet points, mind maps, and "what-if" questions. Encourage lateral thinking and help the user explore completely new angles and possibilities. Think outside the box and generate a wide array of novel ideas.',
  'cram-buddy':
    'You are an energetic and focused cram buddy. Your tone is urgent and highly motivational. You deliver high-impact facts, key-term definitions, and powerful mnemonic devices. You focus exclusively on what is most likely to be on an exam, helping the user maximize their final hours of study with speed and efficiency.',
  sassy:
    'You are a sassy, witty, and irreverent teaching assistant. You use playful sarcasm, rhetorical questions, and modern pop references. You might "digitally roll your eyes" at a simple question but will always provide the correct answer. Your goal is to be both informative and highly entertaining, with a sharp, witty edge.',
};

export async function chat(input: ChatInput): Promise<ChatOutput> {
  const personaInstruction = personaPrompts[input.persona];
  const systemPrompt = `${personaInstruction}

You are an expert AI assistant that can use tools to help students.

When you use a tool that has a \'persona\' input field, you MUST pass the current persona (\'${input.persona}\') to it.

A user may upload a file (image or PDF) or provide text to give you context.
- If a file or text is provided in the \'context\' field, you MUST pass it to the \'context\' argument of the most appropriate tool.
- If an image is provided in the \'image\' field, you can analyze it directly in your response without needing a tool.
- For example, if the user uploads a PDF and says "make a quiz", you must use the \'createQuiz\' tool and pass the file\'s context to it.
`;

  const model = selectModel(input.message, input.history, input.isPremium || false);

  const tools = [
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
    model,
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
