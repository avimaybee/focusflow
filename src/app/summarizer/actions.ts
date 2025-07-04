'use server';

import { z } from 'zod';
import { summarizeNotes } from '@/ai/flows/summarize-notes';

const summarizerSchema = z.object({
  notes: z.string().min(50, 'Please enter at least 50 characters to summarize.'),
});

export async function handleSummarize(input: { notes: string }) {
  const validation = summarizerSchema.safeParse(input);
  if (!validation.success) {
    // In a real app, you'd return this error to the form
    console.error(validation.error.flatten().fieldErrors);
    return null;
  }
  
  try {
    const result = await summarizeNotes({ notes: validation.data.notes });
    return result;
  } catch (error) {
    console.error('Error in summarizeNotes flow:', error);
    return null;
  }
}
