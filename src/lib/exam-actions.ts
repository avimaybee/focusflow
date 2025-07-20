'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { createPracticeExamTool } from '@/ai/tools';
import { z } from 'zod';
import { CreatePracticeExamInputSchema } from '@/types/chat-types';

/**
 * Generates a practice exam and saves it to Firestore.
 * @param userId The ID of the user.
 * @param examConfig The configuration for the exam.
 * @returns The ID of the newly created exam session.
 */
export async function generateAndSaveExam(userId: string, examConfig: z.infer<typeof CreatePracticeExamInputSchema>): Promise<string> {
  if (!userId) throw new Error('User not found.');

  const validatedConfig = CreatePracticeExamInputSchema.parse(examConfig);
  
  const examData = await createPracticeExamTool(validatedConfig);

  const examSessionRef = await db.collection('users').doc(userId).collection('examSessions').add({
    ...examData,
    userId,
    config: validatedConfig,
    status: 'in-progress',
    answers: {},
    score: null,
    createdAt: FieldValue.serverTimestamp(),
  });

  return examSessionRef.id;
}
