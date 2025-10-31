'use server';

import { createClient } from '@supabase/supabase-js';

export interface WeeklyStats {
  chatsThisWeek: number;
  studySessionsThisWeek: number;
  goalsCompleted: number;
  chatsLastWeek: number;
  studySessionsLastWeek: number;
}

/**
 * Get user's weekly analytics
 */
export async function getWeeklyStats(userId: string): Promise<WeeklyStats> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Calculate date ranges
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  startOfThisWeek.setHours(0, 0, 0, 0);
  
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
  
  const endOfLastWeek = new Date(startOfThisWeek);
  endOfLastWeek.setMilliseconds(-1);

  try {
    // Count chat sessions this week
    const { count: chatsThisWeek } = await supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfThisWeek.toISOString());

    // Count chat sessions last week
    const { count: chatsLastWeek } = await supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfLastWeek.toISOString())
      .lte('created_at', endOfLastWeek.toISOString());

    // Count study materials created this week (summaries, flashcards, quizzes)
    const { count: summariesCount } = await supabase
      .from('summaries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfThisWeek.toISOString());

    const { count: flashcardsCount } = await supabase
      .from('flashcard_sets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfThisWeek.toISOString());

    const { count: quizzesCount } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfThisWeek.toISOString());

    // Count last week's study materials
    const { count: summariesLastWeek } = await supabase
      .from('summaries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfLastWeek.toISOString())
      .lte('created_at', endOfLastWeek.toISOString());

    const { count: flashcardsLastWeek } = await supabase
      .from('flashcard_sets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfLastWeek.toISOString())
      .lte('created_at', endOfLastWeek.toISOString());

    const { count: quizzesLastWeek } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfLastWeek.toISOString())
      .lte('created_at', endOfLastWeek.toISOString());

    // Count completed goals this week
    const { count: goalsCompleted } = await supabase
      .from('user_goals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('completed_at', startOfThisWeek.toISOString());

    const studySessionsThisWeek = (summariesCount || 0) + (flashcardsCount || 0) + (quizzesCount || 0);
    const studySessionsLastWeek = (summariesLastWeek || 0) + (flashcardsLastWeek || 0) + (quizzesLastWeek || 0);

    return {
      chatsThisWeek: chatsThisWeek || 0,
      studySessionsThisWeek,
      goalsCompleted: goalsCompleted || 0,
      chatsLastWeek: chatsLastWeek || 0,
      studySessionsLastWeek,
    };
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    return {
      chatsThisWeek: 0,
      studySessionsThisWeek: 0,
      goalsCompleted: 0,
      chatsLastWeek: 0,
      studySessionsLastWeek: 0,
    };
  }
}

/**
 * Get topic mastery data from quiz results
 */
export async function getTopicMastery(userId: string): Promise<Array<{ date: string; [subject: string]: number | string }>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Get quiz results for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('id, subject, created_at, quiz_data')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date and calculate mastery percentage
    const masteryByDate: { [date: string]: { [subject: string]: number[] } } = {};

    quizzes?.forEach((quiz: any) => {
      const date = new Date(quiz.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const subject = quiz.subject || 'General';
      
      if (!masteryByDate[date]) {
        masteryByDate[date] = {};
      }
      
      if (!masteryByDate[date][subject]) {
        masteryByDate[date][subject] = [];
      }

      // Calculate score from quiz_data if available
      const quizData = quiz.quiz_data as any;
      if (quizData?.questions) {
        const correctAnswers = quizData.questions.filter((q: any) => q.userAnswer === q.correctAnswer).length;
        const score = (correctAnswers / quizData.questions.length) * 100;
        masteryByDate[date][subject].push(score);
      }
    });

    // Convert to chart format
    return Object.entries(masteryByDate).map(([date, subjects]) => {
      const entry: { date: string; [subject: string]: number | string } = { date };
      Object.entries(subjects).forEach(([subject, scores]) => {
        entry[subject] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      });
      return entry;
    });
  } catch (error) {
    console.error('Error fetching topic mastery:', error);
    return [];
  }
}

/**
 * Calculate learning velocity (items per day)
 */
export async function getLearningVelocity(userId: string): Promise<{ label: string; value: number }[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Count items created per day for the last 7 days
    const { data: summaries } = await supabase
      .from('summaries')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString());

    const { data: flashcards } = await supabase
      .from('flashcard_sets')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString());

    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString());

    const allItems = [
      ...(summaries || []),
      ...(flashcards || []),
      ...(quizzes || [])
    ];

    // Group by day
    const itemsByDay: { [day: string]: number } = {};
    allItems.forEach(item => {
      const day = new Date(item.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      itemsByDay[day] = (itemsByDay[day] || 0) + 1;
    });

    return Object.entries(itemsByDay).map(([label, value]) => ({ label, value }));
  } catch (error) {
    console.error('Error calculating learning velocity:', error);
    return [];
  }
}

/**
 * Get dashboard stat counts for summaries, quizzes, flashcards, and study plans
 */
export async function getDashboardStats(userId: string): Promise<{
  summariesCount: number;
  quizzesCount: number;
  flashcardsCount: number;
  studyPlansCount: number;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Count all content types
    const { count: summariesCount } = await supabase
      .from('summaries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: quizzesCount } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: flashcardsCount } = await supabase
      .from('flashcard_sets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: studyPlansCount } = await supabase
      .from('study_plans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      summariesCount: summariesCount || 0,
      quizzesCount: quizzesCount || 0,
      flashcardsCount: flashcardsCount || 0,
      studyPlansCount: studyPlansCount || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      summariesCount: 0,
      quizzesCount: 0,
      flashcardsCount: 0,
      studyPlansCount: 0,
    };
  }
}
