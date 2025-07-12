"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HighlightKeyInsightsOutputSchema = exports.HighlightKeyInsightsInputSchema = exports.CreateDiscussionPromptsOutputSchema = exports.CreateDiscussionPromptsInputSchema = exports.CreateMemoryAidOutputSchema = exports.CreateMemoryAidInputSchema = exports.ExplainConceptOutputSchema = exports.ExplainConceptInputSchema = exports.CreateQuizOutputSchema = exports.CreateQuizInputSchema = exports.CreateFlashcardsOutputSchema = exports.CreateFlashcardsInputSchema = exports.CreateStudyPlanOutputSchema = exports.CreateStudyPlanInputSchema = exports.SummarizeNotesOutputSchema = exports.SummarizeNotesInputSchema = exports.ChatOutputSchema = exports.ChatInputSchema = exports.ChatHistoryMessageSchema = exports.PersonaSchema = exports.validPersonas = void 0;
const zod_1 = require("zod");
exports.validPersonas = [
    'neutral',
    'five-year-old',
    'casual',
    'entertaining',
    'brutally-honest',
    'straight-shooter',
    'essay-sharpshooter',
    'idea-generator',
    'cram-buddy',
    'sassy',
];
exports.PersonaSchema = zod_1.z.enum(exports.validPersonas);
exports.ChatHistoryMessageSchema = zod_1.z.object({
    role: zod_1.z.enum(['user', 'model']),
    text: zod_1.z.string(),
});
exports.ChatInputSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    message: zod_1.z.string(),
    sessionId: zod_1.z.string().optional(),
    persona: exports.PersonaSchema.optional().default('neutral'),
    isPremium: zod_1.z.boolean().optional(),
    context: zod_1.z.string().optional(),
    image: zod_1.z.string().optional(),
});
exports.ChatOutputSchema = zod_1.z.object({
    response: zod_1.z.string(),
    rawResponse: zod_1.z.string(),
});
// Schemas for individual tools
exports.SummarizeNotesInputSchema = zod_1.z.object({
    notes: zod_1.z.string().min(20, { message: 'Please provide at least 20 characters of notes to summarize.' }),
});
exports.SummarizeNotesOutputSchema = zod_1.z.object({
    title: zod_1.z.string(),
    summary: zod_1.z.string(),
    keywords: zod_1.z.array(zod_1.z.string()),
});
exports.CreateStudyPlanInputSchema = zod_1.z.object({
    topic: zod_1.z.string(),
    durationDays: zod_1.z.number().positive(),
});
exports.CreateStudyPlanOutputSchema = zod_1.z.object({
    title: zod_1.z.string(),
    plan: zod_1.z.record(zod_1.z.array(zod_1.z.string())), // e.g., { "Day 1": ["Topic A", "Topic B"] }
});
exports.CreateFlashcardsInputSchema = zod_1.z.object({
    topic: zod_1.z.string(),
    count: zod_1.z.number().min(1).max(20),
});
exports.CreateFlashcardsOutputSchema = zod_1.z.object({
    flashcards: zod_1.z.array(zod_1.z.object({ question: zod_1.z.string(), answer: zod_1.z.string() })),
});
exports.CreateQuizInputSchema = zod_1.z.object({
    topic: zod_1.z.string(),
    questionCount: zod_1.z.number().min(1).max(10),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']),
});
exports.CreateQuizOutputSchema = zod_1.z.object({
    title: zod_1.z.string(),
    quiz: zod_1.z.object({
        questions: zod_1.z.array(zod_1.z.object({
            questionText: zod_1.z.string(),
            options: zod_1.z.array(zod_1.z.string()),
            correctAnswer: zod_1.z.string(),
            explanation: zod_1.z.string(),
        })),
    }),
});
exports.ExplainConceptInputSchema = zod_1.z.object({
    concept: zod_1.z.string(),
});
exports.ExplainConceptOutputSchema = zod_1.z.object({
    concept: zod_1.z.string(),
    explanation: zod_1.z.string(),
    analogy: zod_1.z.string(),
});
exports.CreateMemoryAidInputSchema = zod_1.z.object({
    topic: zod_1.z.string(),
    type: zod_1.z.enum(['acronym', 'visualization', 'story']),
});
exports.CreateMemoryAidOutputSchema = zod_1.z.object({
    title: zod_1.z.string(),
    aid: zod_1.z.string(),
});
exports.CreateDiscussionPromptsInputSchema = zod_1.z.object({
    topic: zod_1.z.string(),
    count: zod_1.z.number().min(1).max(10),
});
exports.CreateDiscussionPromptsOutputSchema = zod_1.z.object({
    prompts: zod_1.z.array(zod_1.z.string()),
});
exports.HighlightKeyInsightsInputSchema = zod_1.z.object({
    text: zod_1.z.string(),
});
exports.HighlightKeyInsightsOutputSchema = zod_1.z.object({
    insights: zod_1.z.array(zod_1.z.string()),
});
//# sourceMappingURL=chat-types.js.map