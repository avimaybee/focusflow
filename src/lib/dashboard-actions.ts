'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

const GoalSchema = z.object({
  userId: z.string(),
  subject: z.string().min(1),
  targetHours: z.number().positive(),
  progressHours: z.number().default(0),
  weekStartDate: z.string(), // e.g., "2025-07-21"
  createdAt: z.any(),
  updatedAt: z.any(),
});

/**
 * Fetches all goals for a specific week for a user.
 * @param userId The ID of the user.
 * @param weekStartDate The start date of the week (YYYY-MM-DD).
 */
export async function getGoals(userId: string, weekStartDate: string) {
  if (!userId) throw new Error('User not found.');
  const goalsRef = db.collection('users').doc(userId).collection('userGoals').where('weekStartDate', '==', weekStartDate);
  const snapshot = await goalsRef.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Creates or updates a study goal for a user.
 * @param userId The ID of the user.
 * @param goalData The goal data.
 */
export async function setGoal(userId: string, goalData: { subject: string; targetHours: number; weekStartDate: string }) {
  if (!userId) throw new Error('User not found.');
  
  const data = {
    userId,
    ...goalData,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const validatedData = GoalSchema.partial().parse(data);
  
  // Check if a goal for this subject and week already exists
  const goalsRef = db.collection('users').doc(userId).collection('userGoals');
  const q = query(goalsRef, where('weekStartDate', '==', goalData.weekStartDate), where('subject', '==', goalData.subject));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    await goalsRef.add(validatedData);
  } else {
    // Update the existing goal
    const docId = snapshot.docs[0].id;
    await goalsRef.doc(docId).update({ targetHours: goalData.targetHours, updatedAt: FieldValue.serverTimestamp() });
  }
}

/**
 * Logs a study activity and updates user stats.
 * This is the central function for tracking progress.
 * @param userId The ID of the user.
 * @param activityType The type of activity (e.g., 'quiz_completed', 'summary_created').
 * @param subject The subject of the activity.
 * @param durationMinutes The duration of the activity in minutes.
 */
export async function logStudyActivity(userId: string, activityType: string, subject: string, durationMinutes: number) {
    if (!userId) return;

    const userRef = db.collection('users').doc(userId);
    const activityLogRef = userRef.collection('studyActivityLog');

    const batch = db.batch();

    // 1. Log the specific activity
    batch.add(activityLogRef, {
        activityType,
        subject,
        durationMinutes,
        createdAt: FieldValue.serverTimestamp(),
    });

    // 2. Update total study time for the subject
    batch.update(userRef, {
        [`studyTime.${subject}`]: FieldValue.increment(durationMinutes),
        lastStudyDate: FieldValue.serverTimestamp(),
    });

    // 3. Update streak
    // (Complex streak logic will be added here later)

    // 4. Check for achievements
    // (Achievement logic will be added here later)

    await batch.commit();
}