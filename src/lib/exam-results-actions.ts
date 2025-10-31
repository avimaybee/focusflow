'use server';

import { supabase } from './supabase';

export type ExamResultData = {
  id: string;
  examTitle: string;
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  score: number;
  timeSpent: string;
  completedAt: string;
  difficulty: string;
  questionBreakdown: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }[];
};

/**
 * Fetch exam results from the database
 */
export async function getExamResults(submissionId: string): Promise<ExamResultData | null> {
  try {
    // Get the submission with exam details
    const { data: submission, error: submissionError } = await supabase
      .from('exam_submissions')
      .select(`
        id,
        score,
        total_points,
        time_taken_minutes,
        answers,
        submitted_at,
        exam_id,
        practice_exams (
          id,
          title,
          subject,
          duration_minutes
        )
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      console.error('[getExamResults] Error fetching submission:', submissionError);
      return null;
    }

    // Get all questions for this exam
    const { data: questions, error: questionsError } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', submission.exam_id)
      .order('position');

    if (questionsError || !questions) {
      console.error('[getExamResults] Error fetching questions:', questionsError);
      return null;
    }

    // Parse user answers
    const userAnswers = submission.answers as Record<string, number | null>;

    // Build question breakdown
    const questionBreakdown = questions.map((q, index) => {
      const userAnswerIndex = userAnswers[q.id] ?? null;
      const userAnswer = userAnswerIndex !== null 
        ? (q.options as string[])[userAnswerIndex] 
        : 'No answer provided';
      const correctAnswer = (q.options as string[])[q.correct_answer];
      const isCorrect = userAnswerIndex === q.correct_answer;

      return {
        question: q.question,
        userAnswer,
        correctAnswer,
        isCorrect,
        explanation: q.explanation || 'No explanation available.',
      };
    });

    // Calculate statistics
    const correctCount = questionBreakdown.filter(q => q.isCorrect).length;
    const wrongCount = questionBreakdown.filter(q => !q.isCorrect && q.userAnswer !== 'No answer provided').length;
    const skippedCount = questionBreakdown.filter(q => q.userAnswer === 'No answer provided').length;
    const scorePercentage = Math.round((submission.score / submission.total_points) * 100);

    // Get exam metadata
    const exam = submission.practice_exams as any;
    const difficulty = exam.duration_minutes <= 20 ? 'Easy' : exam.duration_minutes <= 40 ? 'Medium' : 'Hard';

    return {
      id: submission.id,
      examTitle: exam.title,
      subject: exam.subject || 'General',
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      skippedQuestions: skippedCount,
      score: scorePercentage,
      timeSpent: `${submission.time_taken_minutes} minutes`,
      completedAt: new Date(submission.submitted_at).toLocaleString(),
      difficulty,
      questionBreakdown,
    };
  } catch (error) {
    console.error('[getExamResults] Unexpected error:', error);
    return null;
  }
}

/**
 * Submit exam answers and calculate score
 */
export async function submitExamAnswers(
  userId: string,
  examId: string,
  answers: Record<string, number | null>,
  timeTakenMinutes: number
): Promise<string | null> {
  try {
    // Get all questions to calculate score
    const { data: questions, error: questionsError } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', examId);

    if (questionsError || !questions) {
      console.error('[submitExamAnswers] Error fetching questions:', questionsError);
      return null;
    }

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach((q) => {
      totalPoints += q.points;
      if (answers[q.id] === q.correct_answer) {
        earnedPoints += q.points;
      }
    });

    // Insert submission
    const { data: submission, error: insertError } = await supabase
      .from('exam_submissions')
      .insert({
        user_id: userId,
        exam_id: examId,
        answers,
        score: earnedPoints,
        total_points: totalPoints,
        time_taken_minutes: timeTakenMinutes,
      })
      .select('id')
      .single();

    if (insertError || !submission) {
      console.error('[submitExamAnswers] Error creating submission:', insertError);
      return null;
    }

    // Log activity
    await supabase.from('study_activity').insert({
      user_id: userId,
      activity_type: 'exam_attempt',
      activity_data: {
        exam_id: examId,
        score: earnedPoints,
        total_points: totalPoints,
      },
      duration_minutes: timeTakenMinutes,
    });

    return submission.id;
  } catch (error) {
    console.error('[submitExamAnswers] Unexpected error:', error);
    return null;
  }
}
