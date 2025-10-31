'use server';

import { z } from 'zod';
import { CreatePracticeExamInputSchema } from '@/types/chat-types';
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

type ExamQuestion = {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
};

/**
 * Generate exam questions using AI
 */
async function generateExamQuestions(
  topic: string,
  questionCount: number,
  difficulty: string
): Promise<ExamQuestion[]> {
  try {
    const prompt = `You are an expert educator creating practice exam questions.

Topic: ${topic}
Difficulty: ${difficulty}
Number of Questions: ${questionCount}

Generate ${questionCount} multiple-choice questions about "${topic}" at ${difficulty} difficulty level.

For each question:
1. Create a clear, specific question
2. Provide exactly 4 answer options (A, B, C, D)
3. Mark which option is correct (0-3 index)
4. Include a detailed explanation of why the answer is correct

Format your response as a JSON array like this:
[
  {
    "question": "What is...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 2,
    "explanation": "The correct answer is C because..."
  }
]

Make questions challenging but fair for ${difficulty} level. Include varied question types (factual, conceptual, application).

IMPORTANT: Return ONLY the JSON array, no other text.`;

    // Create a one-off chat session for question generation
    const chat = geminiClient.chats.create({
      model: DEFAULT_CHAT_MODEL,
      config: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    });

    const response = await chat.sendMessage({ message: prompt });
    const text = response.text || '';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const questions = JSON.parse(jsonMatch[0]) as ExamQuestion[];
    
    // Validate questions
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid questions format');
    }
    
    return questions.slice(0, questionCount); // Ensure we don't exceed requested count
  } catch (error) {
    console.error('[generateExamQuestions] Error:', error);
    throw new Error('Failed to generate exam questions');
  }
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
    const title = `${topic} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Practice Exam`;
    const slug = generateSlug(title);

    // Generate questions using AI
    const questions = await generateExamQuestions(topic, questionCount, difficulty);

    // Insert the exam into the database
    const { data: exam, error: examError } = await supabase
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

    if (examError || !exam) {
      console.error('[generateAndSaveExam] Error creating exam:', examError);
      throw new Error(`Failed to create practice exam: ${examError?.message}`);
    }

    // Insert all questions
    const questionInserts = questions.map((q, index) => ({
      exam_id: exam.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      points: 1,
      position: index,
    }));

    const { error: questionsError } = await supabase
      .from('exam_questions')
      .insert(questionInserts);

    if (questionsError) {
      console.error('[generateAndSaveExam] Error inserting questions:', questionsError);
      // Delete the exam if questions fail
      await supabase.from('practice_exams').delete().eq('id', exam.id);
      throw new Error('Failed to save exam questions');
    }

    console.log('[generateAndSaveExam] Exam created successfully:', exam.id);
    return exam.id;
  } catch (error) {
    console.error('[generateAndSaveExam] Unexpected error:', error);
    throw error;
  }
}