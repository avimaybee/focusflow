'use server';

import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

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
 * Calculates the current study streak for a user by checking chat activity
 */
export async function getStudyStreak(userId: string): Promise<number> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get all chat sessions ordered by creation date descending
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getStudyStreak] Error fetching sessions:', error);
      return 0;
    }

    if (!sessions || sessions.length === 0) {
      return 0;
    }

    // Calculate streak by checking consecutive days
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(today);
    const sessionDates = new Set<string>();
    
    // Build a set of unique activity dates
    sessions.forEach((session: { created_at: string }) => {
      const sessionDate = new Date(session.created_at);
      sessionDate.setHours(0, 0, 0, 0);
      sessionDates.add(sessionDate.toISOString());
    });

    // Check for consecutive days starting from today or yesterday
    // If user hasn't studied today, we start checking from yesterday
    const latestSessionDate = new Date(sessions[0].created_at);
    latestSessionDate.setHours(0, 0, 0, 0);
    
    const daysSinceLastSession = Math.floor((today.getTime() - latestSessionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If more than 1 day since last session, streak is broken
    if (daysSinceLastSession > 1) {
      return 0;
    }
    
    // Start from today if there's activity today, otherwise from yesterday
    if (daysSinceLastSession === 1) {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Count consecutive days
    while (sessionDates.has(currentDate.toISOString())) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  } catch (error) {
    console.error('[getStudyStreak] Unexpected error:', error);
    return 0;
  }
}

/**
 * Fetches all goals for a specific week for a user.
 * @param userId The ID of the user.
 * @param weekStartDate The start date of the week (YYYY-MM-DD).
 */
export async function getGoals(userId: string, weekStartDate: string) {
  console.log(`[PLACEHOLDER] getGoals called for user ${userId}, week: ${weekStartDate}`);
  return []; // Return empty array for now
}

/**
 * Creates or updates a study goal for a user.
 * @param userId The ID of the user.
 * @param goalData The goal data.
 */
export async function setGoal(userId: string, goalData: { subject: string; targetHours: number; weekStartDate: string }) {
  console.log(`[PLACEHOLDER] setGoal called for user ${userId}, goalData:`, goalData);
  return { success: true };
}

/**
 * Logs a study activity and updates user stats.
 * This is the central function for tracking progress.
 * @param userId The ID of the user.
 * @param activityData The data for the activity.
 */
export async function logStudyActivity(userId: string, activityData: {
    activityType: string;
    subject: string;
    durationMinutes: number;
    score?: number; // e.g., 85 for 85%
}) {
    console.log(`[PLACEHOLDER] logStudyActivity called for user ${userId}, activityData:`, activityData);
}
