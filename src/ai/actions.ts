'use server';

import {
  generate,
  prompt,
  defineFlow,
  run,
  configureGenkit,
} from 'genkit/ai';
import {
  ChatHistoryMessage,
  ChatInput,
  Flashcard,
  Quiz,
  StudyPlan,
  Counterarguments,
  PresentationOutline,
  KeyInsights,
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

export async function chat(input: ChatInput): Promise<{response: string}> {
  const llmResponse = await run('chat', async () =>
    generate({
      model: ai.model(input.persona.model),
      prompt: chatPrompt(input),
      history: input.history,
      config: {
        temperature: input.persona.temperature,
      },
    }),
  );

  return {response: llmResponse.text()};
}

export const createFlashcards = defineFlow(
  {
    name: 'createFlashcards',
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

export const createQuiz = defineFlow(
  {
    name: 'createQuiz',
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

export const createStudyPlan = defineFlow(
  {
    name: 'createStudyPlan',
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

export const rewriteText = defineFlow(
  {
    name: 'rewriteText',
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

export const generateBulletPoints = defineFlow(
  {
    name: 'generateBulletPoints',
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

export const generateCounterarguments = defineFlow(
  {
    name: 'generateCounterarguments',
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

export const generatePresentationOutline = defineFlow(
  {
    name: 'generatePresentationOutline',
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

export const highlightKeyInsights = defineFlow(
  {
    name: 'highlightKeyInsights',
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