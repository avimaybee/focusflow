
// src/ai/tools.ts
/**
 * @fileOverview Defines Genkit tools that the AI can use to perform specific,
 * structured tasks. Each tool is defined with a clear input and output schema
 * to ensure type safety and predictability.
 */
import {ai} from './genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
  SummarizeNotesInputSchema,
  CreateStudyPlanInputSchema,
  CreateFlashcardsInputSchema,
  CreateQuizInputSchema,
  ExplainConceptInputSchema,
  CreateMemoryAidInputSchema,
  CreateDiscussionPromptsInputSchema,
  HighlightKeyInsightsInputSchema,
  SummarizeNotesOutputSchema,
  CreateStudyPlanOutputSchema,
  CreateFlashcardsOutputSchema,
  CreateQuizOutputSchema,
  ExplainConceptOutputSchema,
  CreateMemoryAidOutputSchema,
  CreateDiscussionPromptsOutputSchema,
  HighlightKeyInsightsOutputSchema,
  RewriteTextInputSchema,
  RewriteTextOutputSchema,
  ConvertToBulletPointsInputSchema,
  ConvertToBulletPointsOutputSchema,
  GenerateCounterargumentsInputSchema,
  GenerateCounterargumentsOutputSchema,
  GeneratePresentationOutlineInputSchema,
  GeneratePresentationOutlineOutputSchema,
} from '@/types/chat-types';

// Define the powerful model to be used for all complex tool-based tasks.
const complexTaskModel = googleAI.model('gemini-1.5-pro');

export const summarizeNotesTool = ai.defineTool(
  {
    name: 'summarizeNotesTool',
    description:
      'Summarizes a long piece of text or a document into a concise ' +
      'digest. Use this when the user asks to summarize their notes.',
    inputSchema: SummarizeNotesInputSchema,
    outputSchema: SummarizeNotesOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      model: complexTaskModel,
      prompt: `Generate a concise summary for the following notes. Also,
provide a short, catchy title for the summary and list 3-5 relevant keywords.

Notes:
${input.notes}`,
      output: {
        schema: SummarizeNotesOutputSchema,
      },
    });
    if (!output) {
      throw new Error('Failed to generate a summary.');
    }
    return output;
  }
);

export const createStudyPlanTool = ai.defineTool(
  {
    name: 'createStudyPlanTool',
    description:
      'Generates a structured study plan based on a topic and duration. ' +
      'Use this when the user asks to create a study plan or schedule.',
    inputSchema: CreateStudyPlanInputSchema,
    outputSchema: CreateStudyPlanOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      model: complexTaskModel,
      prompt: `Create a detailed, day-by-day study plan for the topic
"${input.topic}" to be completed over ${input.durationDays} days. The plan
should be structured as a JSON object where each key is a "Day X" and the
value is an array of tasks for that day. Also provide a suitable title for the
study plan.`,
      output: {
        schema: CreateStudyPlanOutputSchema,
      },
    });
    if (!output) {
      throw new Error('Failed to generate a study plan.');
    }
    return output;
  }
);

export const createFlashcardsTool = ai.defineTool(
  {
    name: 'createFlashcardsTool',
    description:
      'Generates a set of question-and-answer flashcards for a topic. ' +
      'Use this when the user asks for flashcards.',
    inputSchema: CreateFlashcardsInputSchema,
    outputSchema: CreateFlashcardsOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      model: complexTaskModel,
      prompt: `Generate a set of ${input.count} flashcards for the topic
"${input.topic}". Each flashcard should have a clear question and a
concise, accurate answer.`,
      output: {
        schema: CreateFlashcardsOutputSchema,
      },
    });
    if (!output) {
      throw new Error('Failed to generate flashcards.');
    }
    return output;
  }
);

export const createQuizTool = ai.defineTool(
  {
    name: 'createQuizTool',
    description:
      'Generates a multiple-choice quiz on a specific topic. Use this ' +
      'when the user asks to be quizzed or wants a practice test.',
    inputSchema: CreateQuizInputSchema,
    outputSchema: CreateQuizOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      model: complexTaskModel,
      prompt: `Generate a multiple-choice quiz on the topic "${input.topic}".
The quiz should have ${input.questionCount} questions and a difficulty level of
"${input.difficulty}". Each question must have four options, a single correct
answer, and a brief explanation for the correct answer. Provide a suitable
title for the quiz.`,
      output: {
        schema: CreateQuizOutputSchema,
      },
    });
    if (!output) {
      throw new Error('Failed to generate a quiz.');
    }
    return output;
  }
);

export const explainConceptTool = ai.defineTool(
  {
    name: 'explainConceptTool',
    description:
      'Explains a specific term or concept in simple terms, providing an ' +
      'analogy. Use this when the user asks for an explanation of something.',
    inputSchema: ExplainConceptInputSchema,
    outputSchema: ExplainConceptOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      model: complexTaskModel,
      prompt: `Explain the concept "${input.concept}" in simple,
easy-to-understand terms. Provide a detailed explanation and a relatable
analogy to help with understanding.`,
      output: {
        schema: ExplainConceptOutputSchema,
      },
    });
    if (!output) {
      throw new Error('Failed to generate an explanation.');
    }
    return output;
  }
);

export const createMemoryAidTool = ai.defineTool(
  {
    name: 'createMemoryAidTool',
    description:
      'Generates a memory aid (mnemonic) for a specific concept. Use this ' +
      'when the user asks for help remembering something.',
    inputSchema: CreateMemoryAidInputSchema,
    outputSchema: CreateMemoryAidOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      model: complexTaskModel,
      prompt: `Generate a creative and effective memory aid of type
"${input.type}" for the topic "${input.topic}". Provide a title for the
memory aid.`,
      output: {
        schema: CreateMemoryAidOutputSchema,
      },
    });
    if (!output) {
      throw new Error('Failed to generate a memory aid.');
    }
    return output;
  }
);

export const createDiscussionPromptsTool = ai.defineTool(
  {
    name: 'createDiscussionPromptsTool',
    description:
      'Generates a set of thought-provoking discussion prompts for a topic. ' +
      'Use this for brainstorming or deeper thinking.',
    inputSchema: CreateDiscussionPromptsInputSchema,
    outputSchema: CreateDiscussionPromptsOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      model: complexTaskModel,
      prompt: `Generate ${input.count} thought-provoking discussion prompts
for the topic "${input.topic}". The prompts should encourage deeper
thinking and conversation.`,
      output: {
        schema: CreateDiscussionPromptsOutputSchema,
      },
    });
    if (!output) {
      throw new Error('Failed to generate discussion prompts.');
    }
    return output;
  }
);

export const highlightKeyInsightsTool = ai.defineTool(
  {
    name: 'highlightKeyInsightsTool',
    description:
      'Identifies and highlights the key insights or "aha" moments from a ' +
      'piece of text.',
    inputSchema: HighlightKeyInsightsInputSchema,
    outputSchema: HighlightKeyInsightsOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      model: complexTaskModel,
      prompt: `Analyze the following text and identify the key insights or
"aha" moments. Present these insights as a list of strings.

Text:
${input.text}`,
      output: {
        schema: HighlightKeyInsightsOutputSchema,
      },
    });
    if (!output) {
      throw new Error('Failed to generate key insights.');
    }
    return output;
  }
);

// NEW SMART TOOLS

export const rewriteTextTool = ai.defineTool(
  {
    name: 'rewriteTextTool',
    description: 'Rewrites a given piece of text in a specified style.',
    inputSchema: RewriteTextInputSchema,
    outputSchema: RewriteTextOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      model: complexTaskModel,
      prompt: `Rewrite the following text to be ${input.style}:\n\n${input.text}`,
      output: {
        schema: RewriteTextOutputSchema,
      },
    });
    if (!output) {
      throw new Error('Failed to rewrite text.');
    }
    return output;
  }
);

export const convertToBulletPointsTool = ai.defineTool(
  {
    name: 'convertToBulletPointsTool',
    description: 'Converts a block of text into a concise bulleted list.',
    inputSchema: ConvertToBulletPointsInputSchema,
    outputSchema: ConvertToBulletPointsOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      model: complexTaskModel,
      prompt: `Convert the following text into a list of key bullet points:\n\n${input.text}`,
      output: {
        schema: ConvertToBulletPointsOutputSchema,
      },
    });
    if (!output) {
      throw new Error('Failed to convert to bullet points.');
    }
    return output;
  }
);

export const generateCounterargumentsTool = ai.defineTool(
  {
    name: 'generateCounterargumentsTool',
    description:
      'Generates counterarguments for a given statement or piece of text.',
    inputSchema: GenerateCounterargumentsInputSchema,
    outputSchema: GenerateCounterargumentsOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      model: complexTaskModel,
      prompt: `Generate 3 strong counterarguments to the following statement. For each, provide the counterpoint and a brief explanation:\n\n${input.text}`,
      output: {
        schema: GenerateCounterargumentsOutputSchema,
      },
    });
    if (!output) {
      throw new Error('Failed to generate counterarguments.');
    }
    return output;
  }
);

export const generatePresentationOutlineTool = ai.defineTool(
  {
    name: 'generatePresentationOutlineTool',
    description: 'Generates a presentation outline for a given topic.',
    inputSchema: GeneratePresentationOutlineInputSchema,
    outputSchema: GeneratePresentationOutlineOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      model: complexTaskModel,
      prompt: `Create a ${input.slideCount}-slide presentation outline for the topic: "${input.topic}". Include a title for the presentation and for each slide, provide a slide title and 3-4 content bullet points.`,
      output: {
        schema: GeneratePresentationOutlineOutputSchema,
      },
    });
    if (!output) {
      throw new Error('Failed to generate a presentation outline.');
    }
    return output;
  }
);
