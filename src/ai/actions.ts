'use server';

import {generate, defineFlow, run} from 'genkit/ai';
import {
  ChatHistoryMessage,
  ChatInput,
  Flashcard,
  Quiz,
  StudyPlan,
  RewriteTextRequest,
  RewriteTextResponse,
  GenerateBulletPointsRequest,
  GenerateBulletPointsResponse,
  GenerateCounterargumentsRequest,
  GenerateCounterargumentsResponse,
  GeneratePresentationOutlineRequest,
  GeneratePresentationOutlineResponse,
  HighlightKeyInsightsRequest,
  HighlightKeyInsightsResponse,
} from './flows/chat-types';
import {
  chatPrompt,
  flashcardPrompt,
  quizPrompt,
  studyPlanPrompt,
  counterargumentsPrompt,
  presentationOutlinePrompt,
  keyInsightsPrompt,
  rewriteTextPrompt,
  bulletPointsPrompt,
} from './flows/prompts';
import {ai} from './genkit';
import {z} from 'zod';
import pdf from 'pdf-parse/lib/pdf-parse';
import {selectModel} from './model-selection';
import {optimizeChatHistory} from './flows/history-optimizer';
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
} from './flows/tools';
import type {Message} from 'genkit';
import {marked} from 'marked';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {db} from '@/lib/firebase';
import {PersonaIDs} from '@/lib/constants';

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

async function saveGeneratedContent(
  userId: string,
  toolName: string,
  output: any,
  source: string,
) {
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

export async function chat(input: ChatInput) {
  const {userId, message, history, context, image, isPremium, persona} = input;

  const model = selectModel(message, history, isPremium || false);
  const personaInstruction = await getPersonaPrompt(persona);
  const systemPrompt = `${personaInstruction} You are an expert AI assistant and a helpful, conversational study partner.`;
  let result;

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

  let chatHistory: Message[] = history.map(msg => ({
    role: msg.role,
    parts: [{text: msg.text}],
  }));

  // Optimize the chat history to manage context window and cost
  chatHistory = await optimizeChatHistory(chatHistory);

  const promptParts = [];
  let fullMessage = message;
  // The 'context' is now the raw text content from the file
  if (context) {
    fullMessage = `CONTEXT FROM UPLOADED FILE:\n${context}\n\nUSER'S REQUEST:\n${message}`;
  }
  promptParts.push({text: fullMessage});

  if (image) {
    // The 'image' field is currently unused in this simplified flow,
    // but is kept for potential future image-specific features.
  }

  result = await ai.generate({
    model,
    system: systemPrompt,
    history: chatHistory,
    prompt: promptParts,
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

  // After generation, check if a tool was called and save the content
  if (result.toolCalls.length > 0) {
    const toolCall = result.toolCalls[0];
    const toolName = toolCall.name;
    const toolOutput = toolCall.output;
    // Use the original message as the source text for context
    await saveGeneratedContent(userId, toolName, toolOutput, message);
  }

  // Correctly extract the response text from the result object.
  const responseText = result.message?.content?.[0]?.text;

  // Convert markdown to HTML if there is a response.
  const formattedResponse = responseText
    ? marked(responseText)
    : 'Sorry, I am not sure how to help with that.';

  return {
    response: formattedResponse,
  };
}

const createFlashcardsFlow = defineFlow(
  {
    name: 'createFlashcardsFlow',
    inputSchema: z.object({sourceText: z.string()}),
    outputSchema: z.object({flashcards: z.array(Flashcard)}),
  },
  async ({sourceText}) => {
    const llmResponse = await generate({
      model: ai.model('googleai/gemini-1.5-flash'),
      prompt: flashcardPrompt(sourceText),
      output: {
        format: 'json',
        schema: z.object({flashcards: z.array(Flashcard)}),
      },
    });

    return llmResponse.output() || {flashcards: []};
  },
);

export async function createFlashcards(input: {
  sourceText: string;
}): Promise<{flashcards: Flashcard[]}> {
  return run(createFlashcardsFlow, input);
}

const createQuizFlow = defineFlow(
  {
    name: 'createQuizFlow',
    inputSchema: z.object({
      sourceText: z.string(),
      numQuestions: z.number(),
      questionType: z.string(),
    }),
    outputSchema: z.object({quiz: Quiz}),
  },
  async ({sourceText, numQuestions, questionType}) => {
    const llmResponse = await generate({
      model: ai.model('googleai/gemini-1.5-flash'),
      prompt: quizPrompt(sourceText, numQuestions, questionType),
      output: {
        format: 'json',
        schema: z.object({quiz: Quiz}),
      },
    });

    // TODO: Handle cases where the model doesn't return a valid quiz.
    return llmResponse.output() || {quiz: {title: '', questions: []}};
  },
);

export async function createQuiz(input: {
  sourceText: string;
  numQuestions: number;
  questionType: string;
}): Promise<{quiz: Quiz}> {
  return run(createQuizFlow, input);
}

const createStudyPlanFlow = defineFlow(
  {
    name: 'createStudyPlanFlow',
    inputSchema: z.object({
      sourceText: z.string(),
      examDate: z.string(),
    }),
    outputSchema: z.object({studyPlan: StudyPlan}),
  },
  async ({sourceText, examDate}) => {
    const llmResponse = await generate({
      model: ai.model('googleai/gemini-1.5-flash'),
      prompt: studyPlanPrompt(sourceText, examDate),
      output: {
        format: 'json',
        schema: z.object({studyPlan: StudyPlan}),
      },
    });

    return (
      llmResponse.output() || {
        studyPlan: {title: '', dailyTasks: [], weeklyGoals: []},
      }
    );
  },
);

export async function createStudyPlan(input: {
  sourceText: string;
  examDate: string;
}): Promise<{studyPlan: StudyPlan}> {
  return run(createStudyPlanFlow, input);
}

const rewriteTextFlow = defineFlow(
  {
    name: 'rewriteTextFlow',
    inputSchema: RewriteTextRequest,
    outputSchema: RewriteTextResponse,
  },
  async ({textToRewrite, style, persona}) => {
    const llmResponse = await generate({
      model: ai.model(persona.model),
      prompt: rewriteTextPrompt(textToRewrite, style),
      config: {
        temperature: persona.temperature,
      },
    });
    return {rewrittenText: llmResponse.text()};
  },
);

export async function rewriteText(
  input: z.infer<typeof RewriteTextRequest>,
): Promise<z.infer<typeof RewriteTextResponse>> {
  return run(rewriteTextFlow, input);
}

const generateBulletPointsFlow = defineFlow(
  {
    name: 'generateBulletPointsFlow',
    inputSchema: GenerateBulletPointsRequest,
    outputSchema: GenerateBulletPointsResponse,
  },
  async ({textToConvert, persona}) => {
    const llmResponse = await generate({
      model: ai.model(persona.model),
      prompt: bulletPointsPrompt(textToConvert),
      output: {
        format: 'json',
        schema: GenerateBulletPointsResponse,
      },
      config: {
        temperature: persona.temperature,
      },
    });
    return llmResponse.output() || {bulletPoints: []};
  },
);

export async function generateBulletPoints(
  input: z.infer<typeof GenerateBulletPointsRequest>,
): Promise<z.infer<typeof GenerateBulletPointsResponse>> {
  return run(generateBulletPointsFlow, input);
}

const generateCounterargumentsFlow = defineFlow(
  {
    name: 'generateCounterargumentsFlow',
    inputSchema: GenerateCounterargumentsRequest,
    outputSchema: GenerateCounterargumentsResponse,
  },
  async ({statementToChallenge, persona}) => {
    const llmResponse = await generate({
      model: ai.model(persona.model),
      prompt: counterargumentsPrompt(statementToChallenge),
      output: {
        format: 'json',
        schema: GenerateCounterargumentsResponse,
      },
      config: {
        temperature: persona.temperature,
      },
    });
    return llmResponse.output() || {counterarguments: []};
  },
);

export async function generateCounterarguments(
  input: z.infer<typeof GenerateCounterargumentsRequest>,
): Promise<z.infer<typeof GenerateCounterargumentsResponse>> {
  return run(generateCounterargumentsFlow, input);
}

const generatePresentationOutlineFlow = defineFlow(
  {
    name: 'generatePresentationOutlineFlow',
    inputSchema: GeneratePresentationOutlineRequest,
    outputSchema: GeneratePresentationOutlineResponse,
  },
  async ({sourceText, persona}) => {
    const llmResponse = await generate({
      model: ai.model(persona.model),
      prompt: presentationOutlinePrompt(sourceText),
      output: {
        format: 'json',
        schema: GeneratePresentationOutlineResponse,
      },
      config: {
        temperature: persona.temperature,
      },
    });
    return (
      llmResponse.output() || {title: 'Presentation Outline', slides: []}
    );
  },
);

export async function generatePresentationOutline(
  input: z.infer<typeof GeneratePresentationOutlineRequest>,
): Promise<z.infer<typeof GeneratePresentationOutlineResponse>> {
  return run(generatePresentationOutlineFlow, input);
}

const highlightKeyInsightsFlow = defineFlow(
  {
    name: 'highlightKeyInsightsFlow',
    inputSchema: HighlightKeyInsightsRequest,
    outputSchema: HighlightKeyInsightsResponse,
  },
  async ({sourceText, persona}) => {
    const llmResponse = await generate({
      model: ai.model(persona.model),
      prompt: keyInsightsPrompt(sourceText),
      output: {
        format: 'json',
        schema: HighlightKeyInsightsResponse,
      },
      config: {
        temperature: persona.temperature,
      },
    });
    return llmResponse.output() || {insights: []};
  },
);

export async function highlightKeyInsights(
  input: z.infer<typeof HighlightKeyInsightsRequest>,
): Promise<z.infer<typeof HighlightKeyInsightsResponse>> {
  return run(highlightKeyInsightsFlow, input);
}

export async function extractText(
  url: string,
  type: string,
): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  if (type.includes('pdf')) {
    const buffer = await blob.arrayBuffer();
    const data = await pdf(buffer);
    return data.text;
  } else {
    return blob.text();
  }
}