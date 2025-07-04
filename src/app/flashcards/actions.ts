'use server';

import { z } from 'zod';
import { createFlashcards, CreateFlashcardsInput } from '@/ai/flows/create-flashcards';

const flashcardSchema = z.object({
  notes: z.string().min(50, 'Please enter at least 50 characters or upload a PDF to generate flashcards.'),
});

export async function handleCreateFlashcards(input: { notes: string }) {
  const validation = flashcardSchema.safeParse(input);
  if (!validation.success) {
    console.error(validation.error.flatten().fieldErrors);
    return null;
  }

  const isPdf = validation.data.notes.startsWith('data:application/pdf;base64,');
  const flowInput: CreateFlashcardsInput = isPdf
    ? { sourcePdf: validation.data.notes }
    : { sourceText: validation.data.notes };
  
  try {
    const result = await createFlashcards(flowInput);
    return result;
  } catch (error) {
    console.error('Error in createFlashcards flow:', error);
    return null;
  }
}
