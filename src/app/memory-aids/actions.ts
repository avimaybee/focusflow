'use server';

import { z } from 'zod';
import { createMemoryAid } from '@/ai/flows/create-memory-aid';

const memoryAidSchema = z.object({
  concept: z.string().min(3, 'Please enter a concept with at least 3 characters.'),
});

export async function handleCreateMemoryAid(input: { concept: string }) {
  const validation = memoryAidSchema.safeParse(input);
  if (!validation.success) {
    console.error(validation.error.flatten().fieldErrors);
    return { error: validation.error.flatten().fieldErrors.concept?.[0] };
  }
  
  try {
    const result = await createMemoryAid(validation.data);
    return { data: result };
  } catch (error) {
    console.error('Error in createMemoryAid flow:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
