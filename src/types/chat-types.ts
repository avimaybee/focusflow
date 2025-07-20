
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

export type Persona = (typeof validPersonas)[number];
export const PersonaSchema = z.enum(validPersonas);

export const ChatHistoryMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string(),
});

export const ChatInputSchema = z.object({
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
  sessionId: z.string().optional(),
  isError: z.boolean().optional(),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

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
  examDate: z.string().optional(),
  syllabus: z.string().optional(),
  durationDays: z.number().positive(),
});
export const CreateStudyPlanOutputSchema = z.object({
  title: z.string(),
  plan: z.array(z.object({
    day: z.number(),
    topic: z.string(),
    tasks: z.array(z.string()),
  })),
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
  text: z.string().min(1, { message: 'Please provide text to highlight insights.' }),
});
export const HighlightKeyInsightsOutputSchema = z.object({
  insights: z.array(z.string()),
});

// NEW SCHEMAS FOR SMART TOOLS

export const RewriteTextInputSchema = z.object({
  text: z.string().min(1, { message: 'Please provide text to rewrite.' }),
  style: z.enum(['clearer and more concise', 'more professional', 'more casual', 'like a tweet']),
});
export const RewriteTextOutputSchema = z.object({
  rewrittenText: z.string(),
});

export const ConvertToBulletPointsInputSchema = z.object({
  text: z.string().min(1, { message: 'Please provide text to convert to bullet points.' }),
});
export const ConvertToBulletPointsOutputSchema = z.object({
  bulletPoints: z.array(z.string()),
});

export const GenerateCounterargumentsInputSchema = z.object({
  text: z.string().min(1, { message: 'Please provide a statement to generate counterarguments for.' }),
});
export const GenerateCounterargumentsOutputSchema = z.object({
  counterarguments: z.array(z.object({
    point: z.string(),
    explanation: z.string(),
  })),
});

export const GeneratePresentationOutlineInputSchema = z.object({
  topic: z.string().min(1, { message: 'Please provide a topic for the presentation.' }),
  slideCount: z.number().min(3).max(20),
});
export const GeneratePresentationOutlineOutputSchema = z.object({
  title: z.string(),
  outline: z.array(z.object({
    slide: z.number(),
    title: z.string(),
    content: z.array(z.string()),
  })),
});

// Smart Tool Inputs
export type RewriteTextInput = {
  textToRewrite: string;
  style: 'clearer and more concise' | 'more professional' | 'more casual';
};

export type GenerateBulletPointsInput = {
  textToConvert: string;
};

export type GenerateCounterargumentsInput = {
  statementToChallenge: string;
};

// Schemas for Advanced Study Tools
export const CreatePracticeExamInputSchema = z.object({
  topic: z.string(),
  questionCount: z.number().min(5).max(50),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionTypes: z.array(z.enum(['multiple-choice', 'short-answer', 'essay'])),
});

export const CreatePracticeExamOutputSchema = z.object({
  title: z.string(),
  exam: z.object({
    questions: z.array(
      z.object({
        questionText: z.string(),
        questionType: z.enum(['multiple-choice', 'short-answer', 'essay']),
        options: z.array(z.string()).optional(),
        correctAnswer: z.string(),
        explanation: z.string(),
      })
    ),
  }),
});
