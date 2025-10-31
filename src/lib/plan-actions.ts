'use server';

import { z } from 'zod';
import { CreateStudyPlanInputSchema } from '@/types/chat-types';
import { supabase } from './supabase';
import { geminiClient, DEFAULT_CHAT_MODEL } from './gemini-client';

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

type DayPlan = {
  day: number;
  topic: string;
  tasks: { id: string; text: string }[];
};

/**
 * Generate study plan days using AI
 */
async function generateStudyPlanDays(
  topic: string,
  durationDays: number,
  syllabus?: string
): Promise<DayPlan[]> {
  try {
    const syllabusInfo = syllabus ? `\n\nSyllabus/Topics to cover:\n${syllabus}` : '';
    
    const prompt = `You are an expert study planner creating a personalized study schedule.

Subject/Topic: ${topic}
Duration: ${durationDays} days${syllabusInfo}

Create a ${durationDays}-day study plan for learning "${topic}".

For each day, provide:
1. A clear topic/focus for that day
2. 3-5 specific, actionable tasks (e.g., "Read Chapter 1: Introduction (20 pages)", "Complete practice problems 1-10", "Create flashcards for key terms")

Make the plan:
- Progressive (build on previous days)
- Balanced (mix reading, practice, review)
- Realistic (appropriate workload per day)
- Include rest/review days if duration > 7 days

Format your response as a JSON array like this:
[
  {
    "day": 1,
    "topic": "Introduction & Foundations",
    "tasks": [
      { "id": "1-1", "text": "Read Chapter 1: Introduction (20 pages)" },
      { "id": "1-2", "text": "Watch overview video lecture (30 min)" },
      { "id": "1-3", "text": "Create summary notes of key concepts" },
      { "id": "1-4", "text": "Complete end-of-chapter quiz" }
    ]
  }
]

IMPORTANT: Return ONLY the JSON array, no other text. Use unique IDs in format "{day}-{task_number}".`;

    const chat = geminiClient.chats.create({
      model: DEFAULT_CHAT_MODEL,
      config: {
        temperature: 0.7,
        maxOutputTokens: 8192, // More tokens for longer plans
      },
    });

    const response = await chat.sendMessage({ message: prompt });
    const text = response.text || '';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const days = JSON.parse(jsonMatch[0]) as DayPlan[];
    
    // Validate days
    if (!Array.isArray(days) || days.length === 0) {
      throw new Error('Invalid study plan format');
    }
    
    return days.slice(0, durationDays); // Ensure we don't exceed requested duration
  } catch (error) {
    console.error('[generateStudyPlanDays] Error:', error);
    throw new Error('Failed to generate study plan');
  }
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
    
    // Generate study plan days using AI
    const days = await generateStudyPlanDays(topic, durationDays, syllabus);
    
    // Generate a title based on the config
    const durationWeeks = Math.ceil(durationDays / 7);
    const title = examDate 
      ? `${topic} Study Plan - ${durationWeeks} Week${durationWeeks > 1 ? 's' : ''} (Exam: ${examDate})`
      : `${topic} Study Plan - ${durationWeeks} Week${durationWeeks > 1 ? 's' : ''}`;
    
    const slug = generateSlug(title);

    // Create plan structure with AI-generated days
    const planData = {
      topic,
      durationDays,
      durationWeeks,
      examDate,
      syllabus,
      days, // AI-generated daily breakdown
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