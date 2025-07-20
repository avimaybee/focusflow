'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { createStudyPlanTool } from '@/ai/tools';
import { z } from 'zod';
import { CreateStudyPlanInputSchema } from '@/types/chat-types';

/**
 * Generates a study plan and saves it to Firestore.
 * @param userId The ID of the user.
 * @param planConfig The configuration for the plan.
 * @returns The ID of the newly created study plan.
 */
export async function generateAndSaveStudyPlan(userId: string, planConfig: z.infer<typeof CreateStudyPlanInputSchema>): Promise<string> {
  if (!userId) throw new Error('User not found.');

  const validatedConfig = CreateStudyPlanInputSchema.parse(planConfig);
  
  const planData = await createStudyPlanTool(validatedConfig);

  const planRef = await db.collection('users').doc(userId).collection('studyPlans').add({
    ...planData,
    userId,
    config: validatedConfig,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return planRef.id;
}
