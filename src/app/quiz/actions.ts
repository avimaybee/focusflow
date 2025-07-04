'use server';

import { z } from 'zod';
import { createQuiz, CreateQuizInput } from '@/ai/flows/create-quiz';

const quizSchema = z.object({
  notes: z.string().min(50, 'Please enter at least 50 characters or upload a PDF to generate a quiz.'),
});

export async function handleCreateQuiz(input: { notes: string }) {
  const validation = quizSchema.safeParse(input);
  if (!validation.success) {
    console.error(validation.error.flatten().fieldErrors);
    return null;
  }

  const isPdf = validation.data.notes.startsWith('data:application/pdf;base64,');
  const flowInput: CreateQuizInput = isPdf
    ? { sourcePdf: validation.data.notes }
    : { sourceText: validation.data.notes };
  
  try {
    const result = await createQuiz(flowInput);
    return result;
  } catch (error) {
    console.error('Error in createQuiz flow:', error);
    return null;
  }
}
