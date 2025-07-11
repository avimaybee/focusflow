
'use server';

/**
 * @fileOverview The main conversational AI flow for the chat interface.
 * It acts as a router, using other specialized AI flows as tools.
 *
 * - chat - The main function for handling chat messages.
 */
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

const personaPrompts = {
  neutral:
    'You are a helpful AI study assistant. Your tone is knowledgeable, encouraging, and clear. You provide direct and effective help without a strong personality. Your goal is to be a reliable and straightforward academic tool.',
  'five-year-old':
    "You are an expert at simplifying complex topics. Explain concepts as if you were talking to a curious 5-year-old. Use very simple words, short sentences, and relatable, everyday analogies (like food, animals, or toys). Your tone is patient and gentle, ensuring the explanation is easy to grasp and never condescending.",
  casual:
    'You are a friendly, down-to-earth classmate. Your tone is relaxed, and conversational. Use contractions (like "don\'t" or "it\'s") and everyday examples. You explain things as if you were studying together, making the interaction feel like a peer-to-peer chat.',
  entertaining:
    'You are an entertaining and humorous educator. Your style is upbeat, witty, and playful. You make learning fun byusing pop-culture analogies (mentioning current shows, games, or internet trends) and light-hearted jokes. Your goal is to make the material memorable and engaging.',
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

function shouldUseTools(message: string): boolean {
  const lowerCaseMessage = message.toLowerCase();
  const toolKeywords = [
    'summarize', 'summary', 'create', 'generate', 'make', 'quiz', 'flashcards',
    'plan', 'schedule', 'explain', 'aid', 'mnemonic', 'discussion', 'prompts',
    'outline', 'presentation', 'insights', 'highlight', 'rewrite', 'cite', 'citations',
    'bullet points', 'counterarguments'
  ];
  return toolKeywords.some(keyword => lowerCaseMessage.includes(keyword));
}


export async function chat(input: ChatInput): Promise<ChatOutput> {
  const { message, history, context, image, isPremium, persona } = input;

  const model = selectModel(message, history, isPremium || false);
  const personaInstruction = personaPrompts[persona];
  const systemPrompt = `${personaInstruction} You are an expert AI assistant and a helpful, conversational study partner.`;
  let result;

  const toolsEnabled = shouldUseTools(message);

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
  if (context) {
    fullMessage = `${message}

[CONTEXT FROM UPLOADED FILE IS PROVIDED]`;
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
    tools: toolsEnabled ? availableTools : [],
    toolChoice: toolsEnabled ? 'auto' : 'none',
    context,
    config: {
      safetySettings: [
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE',
        },
      ],
    },
  });


  // Correctly extract the response text from the result object.
  const responseText = result.message?.content?.[0]?.text;

  // Convert markdown to HTML if there is a response.
  const formattedResponse = responseText ? marked(responseText) : 'Sorry, I am not sure how to help with that.';

  return {
    response: formattedResponse,
  };
}
