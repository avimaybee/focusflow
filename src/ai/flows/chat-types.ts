import { z } from 'zod';

export const validPersonas = [
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
] as const;

export const PersonaSchema = z.enum(validPersonas);

export const ChatHistoryMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string(),
});

export const ChatInputSchema = z.object({
  userId: z.string(),
  message: z.string(),
  sessionId: z.string().optional(),
  persona: PersonaSchema.optional().default('neutral'),
  isPremium: z.boolean().optional(),
  context: z.string().optional(),
  image: z.string().optional(),
});

export const ChatOutputSchema = z.object({
  response: z.string(),
  rawResponse: z.string(),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;
export type ChatHistoryMessage = z.infer<typeof ChatHistoryMessageSchema>;

// Schemas for individual tools
export const SummarizeNotesInputSchema = z.object({
  notes: z.string().min(20, { message: 'Please provide at least 20 characters of notes to summarize.' }),
});
export const SummarizeNotesOutputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  keywords: z.array(z.string()),
});

export const CreateStudyPlanInputSchema = z.object({
  topic: z.string(),
  durationDays: z.number().positive(),
});
export const CreateStudyPlanOutputSchema = z.object({
  title: z.string(),
  plan: z.record(z.array(z.string())), // e.g., { "Day 1": ["Topic A", "Topic B"] }
});

export const CreateFlashcardsInputSchema = z.object({
  topic: z.string(),
  count: z.number().min(1).max(20),
});
export const CreateFlashcardsOutputSchema = z.object({
  flashcards: z.array(z.object({ question: z.string(), answer: z.string() })),
});

export const CreateQuizInputSchema = z.object({
  topic: z.string(),
  questionCount: z.number().min(1).max(10),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});
export const CreateQuizOutputSchema = z.object({
  title: z.string(),
  quiz: z.object({
    questions: z.array(
      z.object({
        questionText: z.string(),
        options: z.array(z.string()),
        correctAnswer: z.string(),
        explanation: z.string(),
      })
    ),
  }),
});

export const ExplainConceptInputSchema = z.object({
  concept: z.string(),
});
export const ExplainConceptOutputSchema = z.object({
  concept: z.string(),
  explanation: z.string(),
  analogy: z.string(),
});

export const CreateMemoryAidInputSchema = z.object({
  topic: z.string(),
  type: z.enum(['acronym', 'visualization', 'story']),
});
export const CreateMemoryAidOutputSchema = z.object({
  title: z.string(),
  aid: z.string(),
});

export const CreateDiscussionPromptsInputSchema = z.object({
  topic: z.string(),
  count: z.number().min(1).max(10),
});
export const CreateDiscussionPromptsOutputSchema = z.object({
  prompts: z.array(z.string()),
});

export const HighlightKeyInsightsInputSchema = z.object({
  text: z.string(),
});
export const HighlightKeyInsightsOutputSchema = z.object({
  insights: z.array(z.string()),
});