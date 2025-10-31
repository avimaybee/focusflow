'use server';

import { z } from 'zod';
import { CreateStudyPlanInputSchema } from '@/types/chat-types';
import { supabase } from './supabase';

/**
 * Generate a URL-friendly slug from a title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

/**
 * Generates a study plan and saves it to Supabase.
 * @param userId The ID of the user.
 * @param planConfig The configuration for the plan.
 * @returns The ID of the newly created study plan.
 */
export async function generateAndSaveStudyPlan(
  userId: string, 
  planConfig: z.infer<typeof CreateStudyPlanInputSchema>
): Promise<string> {
  try {
    console.log('[generateAndSaveStudyPlan] Creating study plan for user:', userId);

    const { topic, durationDays, examDate, syllabus } = planConfig;
    
    // Generate a title based on the config
    const durationWeeks = Math.ceil(durationDays / 7);
    const title = examDate 
      ? `${topic} Study Plan - ${durationWeeks} Week${durationWeeks > 1 ? 's' : ''} (Exam: ${examDate})`
      : `${topic} Study Plan - ${durationWeeks} Week${durationWeeks > 1 ? 's' : ''}`;
    
    const slug = generateSlug(title);

    // Create basic plan structure (can be enhanced by AI later)
    const planData = {
      topic,
      durationDays,
      durationWeeks,
      examDate,
      syllabus,
      weeks: [], // Will be populated by AI generation
    };

    // Insert the study plan into the database
    const { data, error } = await supabase
      .from('study_plans')
      .insert({
        user_id: userId,
        title,
        description: syllabus || `${durationWeeks}-week study plan for ${topic}`,
        subject: topic,
        duration_weeks: durationWeeks,
        plan_data: planData,
        slug,
        is_public: false,
        is_favorite: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[generateAndSaveStudyPlan] Error creating study plan:', error);
      throw new Error(`Failed to create study plan: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from study plan creation');
    }

    console.log('[generateAndSaveStudyPlan] Study plan created successfully:', data.id);
    return data.id;
  } catch (error) {
    console.error('[generateAndSaveStudyPlan] Unexpected error:', error);
    throw error;
  }
}