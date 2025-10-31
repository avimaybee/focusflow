'use server';

import { z } from 'zod';
import { CreatePracticeExamInputSchema } from '@/types/chat-types';
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
 * Generates a practice exam and saves it to Supabase.
 * @param userId The ID of the user.
 * @param examConfig The configuration for the exam.
 * @returns The ID of the newly created exam session.
 */
export async function generateAndSaveExam(
  userId: string, 
  examConfig: z.infer<typeof CreatePracticeExamInputSchema>
): Promise<string> {
  try {
    console.log('[generateAndSaveExam] Creating exam for user:', userId);

    const { topic, questionCount, difficulty } = examConfig;
    
    // Generate a title based on the config
    const title = `${topic} Practice Exam - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Difficulty`;
    const slug = generateSlug(title);

    // Insert the exam into the database
    const { data, error } = await supabase
      .from('practice_exams')
      .insert({
        user_id: userId,
        title,
        subject: topic,
        duration_minutes: questionCount * 2, // Estimate 2 min per question
        slug,
        is_public: false,
        is_favorite: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[generateAndSaveExam] Error creating exam:', error);
      throw new Error(`Failed to create practice exam: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from exam creation');
    }

    console.log('[generateAndSaveExam] Exam created successfully:', data.id);
    return data.id;
  } catch (error) {
    console.error('[generateAndSaveExam] Unexpected error:', error);
    throw error;
  }
}