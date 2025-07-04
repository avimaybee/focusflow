'use server';

import { z } from 'zod';
import { createStudyPlan } from '@/ai/flows/create-study-plan';

const plannerSchema = z.object({
  subjects: z.string().min(3),
  examDate: z.string(),
  weeklyStudyTime: z.coerce.number().min(1),
});

export async function handleCreatePlan(input: {
  subjects: string;
  examDate: string;
  weeklyStudyTime: number;
}) {
  const validation = plannerSchema.safeParse(input);
  if (!validation.success) {
    console.error(validation.error.flatten().fieldErrors);
    return null;
  }

  try {
    const result = await createStudyPlan(validation.data);
    return result;
  } catch (error) {
    console.error('Error in createStudyPlan flow:', error);
    return null;
  }
}
