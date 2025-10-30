// src/ai/tools.ts
/**
 * @fileOverview AI-powered tools using Gemini API for educational content generation
 * Each tool uses structured output and proper error handling
 */
import { z } from 'zod';
import { geminiClient } from '@/lib/gemini-client';
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
  CreatePracticeExamInputSchema,
  CreatePracticeExamOutputSchema,
} from '@/types/chat-types';

/**
 * Helper to call Gemini with structured output
 */
async function callGemini<T>(prompt: string, schema: z.ZodSchema<T>): Promise<T> {
  try {
    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }
    const parsed = JSON.parse(text);
    return schema.parse(parsed);
  } catch (error) {
    console.error('[AI Tools] Gemini API error:', error);
    throw new Error('Failed to generate AI response. Please try again.');
  }
}

export const summarizeNotesTool = async (input: z.infer<typeof SummarizeNotesInputSchema>) => {
  const validated = SummarizeNotesInputSchema.parse(input);
  
  const prompt = `You are an expert at summarizing educational notes. 
Create a concise summary of the following notes with a clear title and relevant keywords.

Notes:
${validated.notes}

Return a JSON object with this structure:
{
  "title": "A clear, concise title for the summary",
  "summary": "A well-structured summary highlighting key concepts and main points",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

  return await callGemini(prompt, SummarizeNotesOutputSchema);
};

export const createStudyPlanTool = async (input: z.infer<typeof CreateStudyPlanInputSchema>) => {
  const validated = CreateStudyPlanInputSchema.parse(input);
  
  const prompt = `You are an expert study planner. Create a detailed study plan for the following:

Topic: ${validated.topic}
Duration: ${validated.durationDays} days
${validated.examDate ? `Exam Date: ${validated.examDate}` : ''}
${validated.syllabus ? `Syllabus: ${validated.syllabus}` : ''}

Create a day-by-day study plan with specific topics and actionable tasks.

Return a JSON object with this structure:
{
  "title": "Study Plan for [Topic]",
  "plan": [
    {
      "day": 1,
      "topic": "Introduction and Fundamentals",
      "tasks": ["Read chapter 1", "Complete practice problems", "Review notes"]
    }
  ]
}`;

  return await callGemini(prompt, CreateStudyPlanOutputSchema);
};

export const createFlashcardsTool = async (input: z.infer<typeof CreateFlashcardsInputSchema>) => {
  const validated = CreateFlashcardsInputSchema.parse(input);
  
  const prompt = `You are an expert at creating effective flashcards for learning.
Create ${validated.count} flashcards on the topic: ${validated.topic}

Each flashcard should have a clear question and a concise answer.

Return a JSON object with this structure:
{
  "flashcards": [
    {
      "question": "What is...?",
      "answer": "A clear, concise answer"
    }
  ]
}`;

  return await callGemini(prompt, CreateFlashcardsOutputSchema);
};

export const createQuizTool = async (input: z.infer<typeof CreateQuizInputSchema>) => {
  const validated = CreateQuizInputSchema.parse(input);
  
  const prompt = `You are an expert quiz creator. Create a ${validated.difficulty} difficulty quiz on: ${validated.topic}

Create ${validated.questionCount} multiple-choice questions with 4 options each.

Return a JSON object with this structure:
{
  "title": "Quiz: [Topic]",
  "quiz": {
    "questions": [
      {
        "questionText": "What is...?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "explanation": "Brief explanation of why this is correct"
      }
    ]
  }
}`;

  return await callGemini(prompt, CreateQuizOutputSchema);
};

export const explainConceptTool = async (input: z.infer<typeof ExplainConceptInputSchema>) => {
  const validated = ExplainConceptInputSchema.parse(input);
  
  const prompt = `You are an expert educator. Explain the concept: ${validated.concept}

Provide a clear explanation and a helpful analogy to make it easier to understand.

Return a JSON object with this structure:
{
  "concept": "${validated.concept}",
  "explanation": "A clear, detailed explanation of the concept",
  "analogy": "A helpful analogy that makes the concept easier to understand"
}`;

  return await callGemini(prompt, ExplainConceptOutputSchema);
};

export const createMemoryAidTool = async (input: z.infer<typeof CreateMemoryAidInputSchema>) => {
  const validated = CreateMemoryAidInputSchema.parse(input);
  
  const prompt = `You are an expert at creating memory aids for studying.
Create a ${validated.type} memory aid for: ${validated.topic}

Return a JSON object with this structure:
{
  "title": "${validated.type.charAt(0).toUpperCase() + validated.type.slice(1)} for ${validated.topic}",
  "aid": "The actual memory aid content (acronym, visualization description, or story)"
}`;

  return await callGemini(prompt, CreateMemoryAidOutputSchema);
};

export const createDiscussionPromptsTool = async (input: z.infer<typeof CreateDiscussionPromptsInputSchema>) => {
  const validated = CreateDiscussionPromptsInputSchema.parse(input);
  
  const prompt = `You are an expert at creating thoughtful discussion prompts.
Create ${validated.count} discussion prompts for: ${validated.topic}

Return a JSON object with this structure:
{
  "prompts": [
    "Thought-provoking question 1?",
    "Thought-provoking question 2?"
  ]
}`;

  return await callGemini(prompt, CreateDiscussionPromptsOutputSchema);
};

export const highlightKeyInsightsTool = async (input: z.infer<typeof HighlightKeyInsightsInputSchema>) => {
  const validated = HighlightKeyInsightsInputSchema.parse(input);
  
  const prompt = `You are an expert at identifying key insights from text.
Extract the most important insights from the following text:

${validated.text}

Return a JSON object with this structure:
{
  "insights": [
    "Key insight 1",
    "Key insight 2",
    "Key insight 3"
  ]
}`;

  return await callGemini(prompt, HighlightKeyInsightsOutputSchema);
};

export const rewriteTextTool = async (input: z.infer<typeof RewriteTextInputSchema>) => {
  const validated = RewriteTextInputSchema.parse(input);
  
  const prompt = `Rewrite the following text to make it ${validated.style}:

${validated.text}

Return a JSON object with this structure:
{
  "rewrittenText": "The rewritten text"
}`;

  return await callGemini(prompt, RewriteTextOutputSchema);
};

export const convertToBulletPointsTool = async (input: z.infer<typeof ConvertToBulletPointsInputSchema>) => {
  const validated = ConvertToBulletPointsInputSchema.parse(input);
  
  const prompt = `Convert the following text into clear, concise bullet points:

${validated.text}

Return a JSON object with this structure:
{
  "bulletPoints": [
    "Bullet point 1",
    "Bullet point 2"
  ]
}`;

  return await callGemini(prompt, ConvertToBulletPointsOutputSchema);
};

export const generateCounterargumentsTool = async (input: z.infer<typeof GenerateCounterargumentsInputSchema>) => {
  const validated = GenerateCounterargumentsInputSchema.parse(input);
  
  const prompt = `Generate thoughtful counterarguments to the following statement:

${validated.text}

Return a JSON object with this structure:
{
  "counterarguments": [
    {
      "point": "Counterargument point",
      "explanation": "Detailed explanation of this counterargument"
    }
  ]
}`;

  return await callGemini(prompt, GenerateCounterargumentsOutputSchema);
};

export const generatePresentationOutlineTool = async (input: z.infer<typeof GeneratePresentationOutlineInputSchema>) => {
  const validated = GeneratePresentationOutlineInputSchema.parse(input);
  
  const prompt = `Create a presentation outline for: ${validated.topic}

Create ${validated.slideCount} slides with clear titles and bullet points for each slide.

Return a JSON object with this structure:
{
  "title": "${validated.topic}",
  "outline": [
    {
      "slide": 1,
      "title": "Introduction",
      "content": ["Point 1", "Point 2", "Point 3"]
    }
  ]
}`;

  return await callGemini(prompt, GeneratePresentationOutlineOutputSchema);
};

export const createPracticeExamTool = async (input: z.infer<typeof CreatePracticeExamInputSchema>) => {
  const validated = CreatePracticeExamInputSchema.parse(input);
  
  const questionTypesStr = validated.questionTypes.join(', ');
  
  const prompt = `Create a practice exam on: ${validated.topic}

Requirements:
- ${validated.questionCount} questions
- Difficulty: ${validated.difficulty}
- Question types: ${questionTypesStr}

For multiple-choice questions, provide 4 options.
For short-answer and essay questions, provide model answers.

Return a JSON object with this structure:
{
  "title": "Practice Exam: ${validated.topic}",
  "exam": {
    "questions": [
      {
        "questionText": "Question text",
        "questionType": "multiple-choice",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "The correct answer",
        "explanation": "Why this is correct"
      }
    ]
  }
}`;

  return await callGemini(prompt, CreatePracticeExamOutputSchema);
};
