'use server';

import { z } from 'zod';
import { summarizeNotes, SummarizeNotesInput } from '@/ai/flows/summarize-notes';

const summarizerSchema = z.object({
  notes: z.string().min(50, 'Please enter at least 50 characters or upload a PDF to summarize.'),
});

export async function handleSummarize(input: { notes: string }) {
  const validation = summarizerSchema.safeParse(input);
  if (!validation.success) {
    // In a real app, you'd return this error to the form
    console.error(validation.error.flatten().fieldErrors);
    return null;
  }

  const isPdf = validation.data.notes.startsWith('data:application/pdf;base64,');
  const flowInput: SummarizeNotesInput = isPdf
    ? { pdfNotes: validation.data.notes }
    : { textNotes: validation.data.notes };
  
  try {
    const result = await summarizeNotes(flowInput);
    return result;
  } catch (error) {
    console.error('Error in summarizeNotes flow:', error);
    return null;
  }
}
