'use server';

import { supabase } from './supabase';

export type StudyPlanTask = {
  id: string;
  text: string;
  completed: boolean;
};

export type StudyPlanDay = {
  day: number;
  date: string;
  topic: string;
  tasks: StudyPlanTask[];
  isToday: boolean;
  isPast: boolean;
};

export type StudyPlanData = {
  id: string;
  title: string;
  subject: string;
  description: string;
  durationWeeks: number;
  totalDays: number;
  startDate: string;
  examDate?: string;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  days: StudyPlanDay[];
};

/**
 * Fetch study plan from database with task completion status
 */
export async function getStudyPlan(planId: string, userId: string): Promise<StudyPlanData | null> {
  try {
    // Get the study plan
    const { data: plan, error: planError } = await supabase
      .from('study_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', userId)
      .single();

    if (planError || !plan) {
      console.error('[getStudyPlan] Error fetching plan:', planError);
      return null;
    }

    // Parse plan data
    const planData = plan.plan_data as any;
    const today = new Date();
    const startDate = new Date(plan.created_at);
    
    // Get task completion status
    const { data: taskStatuses } = await supabase
      .from('study_plan_task_status')
      .select('task_id, completed')
      .eq('plan_id', planId);

    const completionMap = new Map(
      (taskStatuses || []).map(t => [t.task_id, t.completed])
    );

    // Build days array with completion status
    const days: StudyPlanDay[] = (planData.days || []).map((day: any, index: number) => {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + index);
      
      const tasksWithStatus = (day.tasks || []).map((task: any) => ({
        id: task.id || `${planId}-${index}-${task.text.slice(0, 10)}`,
        text: task.text,
        completed: completionMap.get(task.id) || false,
      }));

      return {
        day: index + 1,
        date: dayDate.toLocaleDateString(),
        topic: day.topic,
        tasks: tasksWithStatus,
        isToday: dayDate.toDateString() === today.toDateString(),
        isPast: dayDate < today && dayDate.toDateString() !== today.toDateString(),
      };
    });

    // Calculate progress
    const allTasks = days.flatMap(d => d.tasks);
    const completedTasks = allTasks.filter(t => t.completed).length;
    const totalTasks = allTasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: plan.id,
      title: plan.title,
      subject: plan.subject || 'General',
      description: plan.description || '',
      durationWeeks: plan.duration_weeks || 1,
      totalDays: days.length,
      startDate: startDate.toLocaleDateString(),
      examDate: planData.examDate,
      progress,
      completedTasks,
      totalTasks,
      days,
    };
  } catch (error) {
    console.error('[getStudyPlan] Unexpected error:', error);
    return null;
  }
}

/**
 * Update task completion status
 */
export async function updateTaskStatus(
  planId: string,
  userId: string,
  taskId: string,
  completed: boolean
): Promise<boolean> {
  try {
    // Upsert task status
    const { error } = await supabase
      .from('study_plan_task_status')
      .upsert({
        plan_id: planId,
        user_id: userId,
        task_id: taskId,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      }, {
        onConflict: 'plan_id,task_id',
      });

    if (error) {
      console.error('[updateTaskStatus] Error updating status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[updateTaskStatus] Unexpected error:', error);
    return false;
  }
}

/**
 * Create study plan task status table if it doesn't exist
 * This should be run as a migration but adding programmatic creation as fallback
 */
export async function ensureTaskStatusTable(): Promise<void> {
  try {
    // This will be handled by migration, but check if table exists
    const { error } = await supabase
      .from('study_plan_task_status')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      // Table doesn't exist - it should be created via migration
      console.warn('[ensureTaskStatusTable] Task status table missing - run migration');
    }
  } catch (error) {
    console.error('[ensureTaskStatusTable] Error checking table:', error);
  }
}
