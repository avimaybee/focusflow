
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
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function getPersonaPrompt(personaId: string): Promise<string> {
    const personaRef = doc(db, 'personas', personaId);
    const personaSnap = await getDoc(personaRef);
    if (personaSnap.exists()) {
        return personaSnap.data().prompt;
    }
    // Fallback to a neutral prompt if the persona is not found
    return 'You are a helpful AI study assistant. Your tone is knowledgeable, encouraging, and clear. You provide direct and effective help without a strong personality. Your goal is to be a reliable and straightforward academic tool.';
}

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
  const personaInstruction = await getPersonaPrompt(persona);
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
