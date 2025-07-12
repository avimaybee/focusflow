"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.highlightKeyInsightsTool = exports.createDiscussionPromptsTool = exports.createMemoryAidTool = exports.explainConceptTool = exports.createQuizTool = exports.createFlashcardsTool = exports.createStudyPlanTool = exports.summarizeNotesTool = void 0;
/**
 * @fileOverview Defines Genkit tools that the AI can use to perform specific, structured tasks.
 * Each tool is defined with a clear input and output schema to ensure type safety and predictability.
 */
const genkit_1 = require("../genkit");
const zod_1 = require("zod");
const chat_types_1 = require("./chat-types");
exports.summarizeNotesTool = genkit_1.ai.defineTool({
    name: 'summarizeNotesTool',
    description: 'Summarizes a long piece of text or a document into a concise digest.',
    inputSchema: chat_types_1.SummarizeNotesInputSchema,
    outputSchema: zod_1.z.string(),
}, async (input) => {
    console.log('Summarizing notes:', input.notes.substring(0, 50));
    const output = {
        title: 'Mock Summary',
        summary: 'This is a mock summary of the provided notes.',
        keywords: ['mock', 'summary', 'notes'],
    };
    return JSON.stringify(output);
});
exports.createStudyPlanTool = genkit_1.ai.defineTool({
    name: 'createStudyPlanTool',
    description: 'Generates a structured study plan.',
    inputSchema: chat_types_1.CreateStudyPlanInputSchema,
    outputSchema: zod_1.z.string(),
}, async (input) => {
    console.log(`Creating study plan for ${input.topic} over ${input.durationDays} days.`);
    const output = {
        title: `Study Plan for ${input.topic}`,
        plan: {
            'Day 1': ['Introduction to topic', 'Read Chapter 1'],
            'Day 2': ['Practice exercises', 'Review notes'],
        },
    };
    return JSON.stringify(output);
});
exports.createFlashcardsTool = genkit_1.ai.defineTool({
    name: 'createFlashcardsTool',
    description: 'Generates a set of question-and-answer flashcards.',
    inputSchema: chat_types_1.CreateFlashcardsInputSchema,
    outputSchema: zod_1.z.string(),
}, async (input) => {
    console.log(`Creating ${input.count} flashcards for ${input.topic}.`);
    const output = {
        flashcards: Array.from({ length: input.count }, (_, i) => ({
            question: `What is concept ${i + 1} in ${input.topic}?`,
            answer: `This is the detailed answer for concept ${i + 1}.`,
        })),
    };
    return JSON.stringify(output);
});
exports.createQuizTool = genkit_1.ai.defineTool({
    name: 'createQuizTool',
    description: 'Generates a multiple-choice quiz.',
    inputSchema: chat_types_1.CreateQuizInputSchema,
    outputSchema: zod_1.z.string(),
}, async (input) => {
    console.log(`Creating a ${input.difficulty} quiz with ${input.questionCount} questions on ${input.topic}.`);
    const output = {
        title: `Quiz on ${input.topic}`,
        quiz: {
            questions: Array.from({ length: input.questionCount }, (_, i) => ({
                questionText: `What is the main idea of ${input.topic}, question ${i + 1}?`,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: 'Option A',
                explanation: 'This is the explanation for why Option A is correct.',
            })),
        },
    };
    return JSON.stringify(output);
});
exports.explainConceptTool = genkit_1.ai.defineTool({
    name: 'explainConceptTool',
    description: 'Explains a specific term or concept.',
    inputSchema: chat_types_1.ExplainConceptInputSchema,
    outputSchema: zod_1.z.string(),
}, async (input) => {
    console.log(`Explaining concept: ${input.concept}`);
    const output = {
        concept: input.concept,
        explanation: `This is a detailed explanation of ${input.concept}.`,
        analogy: `Think of ${input.concept} like a library.`,
    };
    return JSON.stringify(output);
});
exports.createMemoryAidTool = genkit_1.ai.defineTool({
    name: 'createMemoryAidTool',
    description: 'Generates a memory aid for a specific concept.',
    inputSchema: chat_types_1.CreateMemoryAidInputSchema,
    outputSchema: zod_1.z.string(),
}, async (input) => {
    console.log(`Creating a ${input.type} memory aid for ${input.topic}.`);
    const output = {
        title: `Memory Aid for ${input.topic}`,
        aid: `Here is a memorable ${input.type} to help you remember ${input.topic}.`,
    };
    return JSON.stringify(output);
});
exports.createDiscussionPromptsTool = genkit_1.ai.defineTool({
    name: 'createDiscussionPromptsTool',
    description: 'Generates a set of discussion prompts.',
    inputSchema: chat_types_1.CreateDiscussionPromptsInputSchema,
    outputSchema: zod_1.z.string(),
}, async (input) => {
    console.log(`Creating ${input.count} discussion prompts for ${input.topic}.`);
    const output = {
        prompts: Array.from({ length: input.count }, (_, i) => `Prompt ${i + 1} about ${input.topic}: ...?`),
    };
    return JSON.stringify(output);
});
exports.highlightKeyInsightsTool = genkit_1.ai.defineTool({
    name: 'highlightKeyInsightsTool',
    description: 'Identifies and highlights the key insights from a piece of text.',
    inputSchema: chat_types_1.HighlightKeyInsightsInputSchema,
    outputSchema: zod_1.z.string(),
}, async (input) => {
    console.log('Highlighting key insights from text...');
    const output = {
        insights: [
            'Insight 1: ...',
            'Insight 2: ...',
        ],
    };
    return JSON.stringify(output);
});
//# sourceMappingURL=tools.js.map