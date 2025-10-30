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
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartDate)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getGoals] Error fetching goals:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getGoals] Unexpected error:', error);
    return [];
  }
}

/**
 * Creates or updates a study goal for a user.
 * @param userId The ID of the user.
 * @param goalData The goal data.
 */
export async function setGoal(userId: string, goalData: { subject: string; targetHours: number; weekStartDate: string; id?: string }) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (goalData.id) {
      // Update existing goal
      const { data, error } = await supabase
        .from('user_goals')
        .update({
          subject: goalData.subject,
          target_hours: goalData.targetHours,
        })
        .eq('id', goalData.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[setGoal] Error updating goal:', error);
        throw error;
      }

      return { success: true, goal: data };
    } else {
      // Create new goal
      const { data, error } = await supabase
        .from('user_goals')
        .insert({
          user_id: userId,
          subject: goalData.subject,
          target_hours: goalData.targetHours,
          week_start_date: goalData.weekStartDate,
          progress_hours: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('[setGoal] Error creating goal:', error);
        throw error;
      }

      return { success: true, goal: data };
    }
  } catch (error) {
    console.error('[setGoal] Unexpected error:', error);
    return { success: false, error };
  }
}

/**
 * Update goal progress hours
 */
export async function updateGoalProgress(userId: string, goalId: string, progressHours: number) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('user_goals')
      .update({ progress_hours: progressHours })
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[updateGoalProgress] Error updating goal progress:', error);
      throw error;
    }

    return { success: true, goal: data };
  } catch (error) {
    console.error('[updateGoalProgress] Unexpected error:', error);
    return { success: false, error };
  }
}

/**
 * Mark a goal as complete
 */
export async function markGoalComplete(userId: string, goalId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('user_goals')
      .update({ is_completed: true })
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[markGoalComplete] Error marking goal complete:', error);
      throw error;
    }

    return { success: true, goal: data };
  } catch (error) {
    console.error('[markGoalComplete] Unexpected error:', error);
    return { success: false, error };
  }
}

/**
 * Delete a goal
 */
export async function deleteGoal(userId: string, goalId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('user_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) {
      console.error('[deleteGoal] Error deleting goal:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('[deleteGoal] Unexpected error:', error);
    return { success: false, error };
  }
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
    relatedItemId?: string;
    relatedItemType?: string;
}) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data, error } = await supabase
        .from('study_activity')
        .insert({
          user_id: userId,
          activity_type: activityData.activityType,
          subject: activityData.subject,
          duration_minutes: activityData.durationMinutes,
          score: activityData.score,
          related_item_id: activityData.relatedItemId,
          related_item_type: activityData.relatedItemType,
        })
        .select()
        .single();

      if (error) {
        console.error('[logStudyActivity] Error logging activity:', error);
        throw error;
      }

      // Update related goal progress if subject matches
      const durationHours = activityData.durationMinutes / 60;
      
      // Get current week start date (Monday)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days, else go to Monday
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);
      const weekStartDate = monday.toISOString().split('T')[0];
      
      // Find matching goal for this week and subject
      const { data: goals, error: goalsError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('subject', activityData.subject)
        .eq('week_start_date', weekStartDate);

      if (!goalsError && goals && goals.length > 0) {
        const goal = goals[0];
        const newProgressHours = (goal.progress_hours || 0) + durationHours;
        
        await supabase
          .from('user_goals')
          .update({ progress_hours: newProgressHours })
          .eq('id', goal.id);
      }

      return { success: true, activity: data };
    } catch (error) {
      console.error('[logStudyActivity] Unexpected error:', error);
      return { success: false, error };
    }
}

/**
 * Get weekly study statistics for analytics
 */
export async function getWeeklyStats(userId: string, weekStartDate: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Calculate week end date
    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
    
    const { data, error } = await supabase
      .from('study_activity')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[getWeeklyStats] Error fetching weekly stats:', error);
      return { totalMinutes: 0, totalActivities: 0, averageScore: 0, breakdown: {} };
    }

    const activities = data || [];
    const totalMinutes = activities.reduce((sum: number, act: any) => sum + (act.duration_minutes || 0), 0);
    const totalActivities = activities.length;
    
    const scoresArray = activities.filter((act: any) => act.score !== null).map((act: any) => act.score);
    const averageScore = scoresArray.length > 0 
      ? scoresArray.reduce((sum: number, score: number) => sum + score, 0) / scoresArray.length 
      : 0;
    
    // Breakdown by subject
    const breakdown: Record<string, { minutes: number; count: number }> = {};
    activities.forEach((act: any) => {
      if (!breakdown[act.subject]) {
        breakdown[act.subject] = { minutes: 0, count: 0 };
      }
      breakdown[act.subject].minutes += act.duration_minutes || 0;
      breakdown[act.subject].count += 1;
    });

    return {
      totalMinutes,
      totalActivities,
      averageScore: Math.round(averageScore),
      breakdown,
      activities,
    };
  } catch (error) {
    console.error('[getWeeklyStats] Unexpected error:', error);
    return { totalMinutes: 0, totalActivities: 0, averageScore: 0, breakdown: {} };
  }
}

/**
 * Get all study activity for a user (with optional filters)
 */
export async function getStudyActivity(
  userId: string,
  filters?: {
    subject?: string;
    activityType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let query = supabase
      .from('study_activity')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.subject) {
      query = query.eq('subject', filters.subject);
    }

    if (filters?.activityType) {
      query = query.eq('activity_type', filters.activityType);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[getStudyActivity] Error fetching study activity:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getStudyActivity] Unexpected error:', error);
    return [];
  }
}
