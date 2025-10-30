'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================================================
// SUMMARIES
// ============================================================================

export async function saveSummary(
  userId: string,
  data: {
    title: string;
    content: string;
    keywords?: string[];
    source_type?: string;
    source_id?: string;
  }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: summary, error } = await supabase
      .from('summaries')
      .insert({
        user_id: userId,
        title: data.title,
        content: data.content,
        keywords: data.keywords || [],
        source_type: data.source_type,
        source_id: data.source_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving summary:', error);
      throw new Error('Failed to save summary');
    }

    return summary;
  } catch (err) {
    console.error('Exception in saveSummary:', err);
    throw err;
  }
}

export async function getSummaries(
  userId: string,
  filters?: {
    is_favorite?: boolean;
    is_public?: boolean;
  }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let query = supabase
      .from('summaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.is_favorite !== undefined) {
      query = query.eq('is_favorite', filters.is_favorite);
    }

    if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching summaries:', error);
      throw new Error('Failed to fetch summaries');
    }

    return data || [];
  } catch (err) {
    console.error('Exception in getSummaries:', err);
    throw err;
  }
}

export async function getSummaryById(userId: string, summaryId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('id', summaryId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching summary:', error);
      throw new Error('Failed to fetch summary');
    }

    return data;
  } catch (err) {
    console.error('Exception in getSummaryById:', err);
    throw err;
  }
}

export async function updateSummary(
  userId: string,
  summaryId: string,
  updates: {
    title?: string;
    content?: string;
    keywords?: string[];
    is_favorite?: boolean;
  }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('summaries')
      .update(updates)
      .eq('id', summaryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating summary:', error);
      throw new Error('Failed to update summary');
    }

    return data;
  } catch (err) {
    console.error('Exception in updateSummary:', err);
    throw err;
  }
}

export async function deleteSummary(userId: string, summaryId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('summaries')
      .delete()
      .eq('id', summaryId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting summary:', error);
      throw new Error('Failed to delete summary');
    }

    return { success: true };
  } catch (err) {
    console.error('Exception in deleteSummary:', err);
    throw err;
  }
}

export async function makeSummaryPublic(userId: string, summaryId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Generate a unique slug
    const slug = `summary-${summaryId.slice(0, 8)}-${Date.now()}`;
    
    const { data, error } = await supabase
      .from('summaries')
      .update({
        is_public: true,
        slug: slug,
      })
      .eq('id', summaryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error making summary public:', error);
      throw new Error('Failed to make summary public');
    }

    return data;
  } catch (err) {
    console.error('Exception in makeSummaryPublic:', err);
    throw err;
  }
}

// ============================================================================
// FLASHCARDS
// ============================================================================

export async function saveFlashcardSet(
  userId: string,
  data: {
    title: string;
    description?: string;
    flashcards: Array<{ front: string; back: string; hint?: string }>;
    source_type?: string;
    source_id?: string;
  }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Insert the flashcard set
    const { data: flashcardSet, error: setError } = await supabase
      .from('flashcard_sets')
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description,
        source_type: data.source_type,
        source_id: data.source_id,
      })
      .select()
      .single();

    if (setError) {
      console.error('Error saving flashcard set:', setError);
      throw new Error('Failed to save flashcard set');
    }

    // Insert the flashcards
    const flashcardsToInsert = data.flashcards.map((card, index) => ({
      set_id: flashcardSet.id,
      front: card.front,
      back: card.back,
      hint: card.hint,
      position: index,
    }));

    const { error: cardsError } = await supabase
      .from('flashcards')
      .insert(flashcardsToInsert);

    if (cardsError) {
      console.error('Error saving flashcards:', cardsError);
      // Rollback: delete the set
      await supabase.from('flashcard_sets').delete().eq('id', flashcardSet.id);
      throw new Error('Failed to save flashcards');
    }

    return flashcardSet;
  } catch (err) {
    console.error('Exception in saveFlashcardSet:', err);
    throw err;
  }
}

export async function getFlashcardSets(
  userId: string,
  filters?: {
    is_favorite?: boolean;
    is_public?: boolean;
  }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let query = supabase
      .from('flashcard_sets')
      .select('*, flashcards(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.is_favorite !== undefined) {
      query = query.eq('is_favorite', filters.is_favorite);
    }

    if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching flashcard sets:', error);
      throw new Error('Failed to fetch flashcard sets');
    }

    return data || [];
  } catch (err) {
    console.error('Exception in getFlashcardSets:', err);
    throw err;
  }
}

export async function getFlashcardSetById(userId: string, setId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('flashcard_sets')
      .select('*, flashcards(*)')
      .eq('id', setId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching flashcard set:', error);
      throw new Error('Failed to fetch flashcard set');
    }

    return data;
  } catch (err) {
    console.error('Exception in getFlashcardSetById:', err);
    throw err;
  }
}

export async function deleteFlashcardSet(userId: string, setId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Delete flashcards first (foreign key constraint)
    await supabase.from('flashcards').delete().eq('set_id', setId);
    
    // Delete the set
    const { error } = await supabase
      .from('flashcard_sets')
      .delete()
      .eq('id', setId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting flashcard set:', error);
      throw new Error('Failed to delete flashcard set');
    }

    return { success: true };
  } catch (err) {
    console.error('Exception in deleteFlashcardSet:', err);
    throw err;
  }
}

export async function makeFlashcardsPublic(userId: string, setId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Generate a unique slug
    const slug = `flashcards-${setId.slice(0, 8)}-${Date.now()}`;
    
    const { data, error } = await supabase
      .from('flashcard_sets')
      .update({
        is_public: true,
        slug: slug,
      })
      .eq('id', setId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error making flashcards public:', error);
      throw new Error('Failed to make flashcards public');
    }

    return data;
  } catch (err) {
    console.error('Exception in makeFlashcardsPublic:', err);
    throw err;
  }
}

// ============================================================================
// QUIZZES
// ============================================================================

export async function saveQuiz(
  userId: string,
  data: {
    title: string;
    description?: string;
    questions: Array<{
      question: string;
      options: string[];
      correct_answer: number;
      explanation?: string;
    }>;
    source_type?: string;
    source_id?: string;
  }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Insert the quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description,
        source_type: data.source_type,
        source_id: data.source_id,
      })
      .select()
      .single();

    if (quizError) {
      console.error('Error saving quiz:', quizError);
      throw new Error('Failed to save quiz');
    }

    // Insert the questions
    const questionsToInsert = data.questions.map((q, index) => ({
      quiz_id: quiz.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      position: index,
    }));

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert);

    if (questionsError) {
      console.error('Error saving quiz questions:', questionsError);
      // Rollback: delete the quiz
      await supabase.from('quizzes').delete().eq('id', quiz.id);
      throw new Error('Failed to save quiz questions');
    }

    return quiz;
  } catch (err) {
    console.error('Exception in saveQuiz:', err);
    throw err;
  }
}

export async function getQuizzes(
  userId: string,
  filters?: {
    is_favorite?: boolean;
    is_public?: boolean;
  }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let query = supabase
      .from('quizzes')
      .select('*, quiz_questions(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.is_favorite !== undefined) {
      query = query.eq('is_favorite', filters.is_favorite);
    }

    if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching quizzes:', error);
      throw new Error('Failed to fetch quizzes');
    }

    return data || [];
  } catch (err) {
    console.error('Exception in getQuizzes:', err);
    throw err;
  }
}

export async function getQuizById(userId: string, quizId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('quizzes')
      .select('*, quiz_questions(*)')
      .eq('id', quizId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching quiz:', error);
      throw new Error('Failed to fetch quiz');
    }

    return data;
  } catch (err) {
    console.error('Exception in getQuizById:', err);
    throw err;
  }
}

export async function deleteQuiz(userId: string, quizId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Delete questions first (foreign key constraint)
    await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
    
    // Delete the quiz
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting quiz:', error);
      throw new Error('Failed to delete quiz');
    }

    return { success: true };
  } catch (err) {
    console.error('Exception in deleteQuiz:', err);
    throw err;
  }
}

export async function makeQuizPublic(userId: string, quizId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Generate a unique slug
    const slug = `quiz-${quizId.slice(0, 8)}-${Date.now()}`;
    
    const { data, error } = await supabase
      .from('quizzes')
      .update({
        is_public: true,
        slug: slug,
      })
      .eq('id', quizId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error making quiz public:', error);
      throw new Error('Failed to make quiz public');
    }

    return data;
  } catch (err) {
    console.error('Exception in makeQuizPublic:', err);
    throw err;
  }
}

// ============================================================================
// STUDY PLANS
// ============================================================================

export async function saveStudyPlan(
  userId: string,
  data: {
    title: string;
    description?: string;
    plan_data: any;
    source_type?: string;
    source_id?: string;
  }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: studyPlan, error } = await supabase
      .from('study_plans')
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description,
        plan_data: data.plan_data,
        source_type: data.source_type,
        source_id: data.source_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving study plan:', error);
      throw new Error('Failed to save study plan');
    }

    return studyPlan;
  } catch (err) {
    console.error('Exception in saveStudyPlan:', err);
    throw err;
  }
}

export async function getStudyPlans(
  userId: string,
  filters?: {
    is_favorite?: boolean;
    is_public?: boolean;
  }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let query = supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.is_favorite !== undefined) {
      query = query.eq('is_favorite', filters.is_favorite);
    }

    if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching study plans:', error);
      throw new Error('Failed to fetch study plans');
    }

    return data || [];
  } catch (err) {
    console.error('Exception in getStudyPlans:', err);
    throw err;
  }
}

export async function getStudyPlanById(userId: string, planId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching study plan:', error);
      throw new Error('Failed to fetch study plan');
    }

    return data;
  } catch (err) {
    console.error('Exception in getStudyPlanById:', err);
    throw err;
  }
}

export async function updateStudyPlan(
  userId: string,
  planId: string,
  updates: {
    title?: string;
    description?: string;
    plan_data?: any;
    progress?: number;
    is_favorite?: boolean;
  }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('study_plans')
      .update(updates)
      .eq('id', planId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating study plan:', error);
      throw new Error('Failed to update study plan');
    }

    return data;
  } catch (err) {
    console.error('Exception in updateStudyPlan:', err);
    throw err;
  }
}

export async function deleteStudyPlan(userId: string, planId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('study_plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting study plan:', error);
      throw new Error('Failed to delete study plan');
    }

    return { success: true };
  } catch (err) {
    console.error('Exception in deleteStudyPlan:', err);
    throw err;
  }
}

export async function makeStudyPlanPublic(userId: string, planId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Generate a unique slug
    const slug = `study-plan-${planId.slice(0, 8)}-${Date.now()}`;
    
    const { data, error } = await supabase
      .from('study_plans')
      .update({
        is_public: true,
        slug: slug,
      })
      .eq('id', planId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error making study plan public:', error);
      throw new Error('Failed to make study plan public');
    }

    return data;
  } catch (err) {
    console.error('Exception in makeStudyPlanPublic:', err);
    throw err;
  }
}

// ============================================================================
// PRACTICE EXAMS
// ============================================================================

export async function savePracticeExam(
  userId: string,
  data: {
    title: string;
    description?: string;
    time_limit?: number;
    questions: Array<{
      question: string;
      options: string[];
      correct_answer: number;
      explanation?: string;
      points?: number;
    }>;
    source_type?: string;
    source_id?: string;
  }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Calculate total points
    const totalPoints = data.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    
    // Insert the exam
    const { data: exam, error: examError } = await supabase
      .from('practice_exams')
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description,
        time_limit: data.time_limit,
        total_points: totalPoints,
        source_type: data.source_type,
        source_id: data.source_id,
      })
      .select()
      .single();

    if (examError) {
      console.error('Error saving practice exam:', examError);
      throw new Error('Failed to save practice exam');
    }

    // Insert the questions
    const questionsToInsert = data.questions.map((q, index) => ({
      exam_id: exam.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      points: q.points || 1,
      position: index,
    }));

    const { error: questionsError } = await supabase
      .from('exam_questions')
      .insert(questionsToInsert);

    if (questionsError) {
      console.error('Error saving exam questions:', questionsError);
      // Rollback: delete the exam
      await supabase.from('practice_exams').delete().eq('id', exam.id);
      throw new Error('Failed to save exam questions');
    }

    return exam;
  } catch (err) {
    console.error('Exception in savePracticeExam:', err);
    throw err;
  }
}

export async function getPracticeExams(
  userId: string,
  filters?: {
    is_favorite?: boolean;
    is_public?: boolean;
  }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let query = supabase
      .from('practice_exams')
      .select('*, exam_questions(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.is_favorite !== undefined) {
      query = query.eq('is_favorite', filters.is_favorite);
    }

    if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching practice exams:', error);
      throw new Error('Failed to fetch practice exams');
    }

    return data || [];
  } catch (err) {
    console.error('Exception in getPracticeExams:', err);
    throw err;
  }
}

export async function getPracticeExamById(userId: string, examId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('practice_exams')
      .select('*, exam_questions(*)')
      .eq('id', examId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching practice exam:', error);
      throw new Error('Failed to fetch practice exam');
    }

    return data;
  } catch (err) {
    console.error('Exception in getPracticeExamById:', err);
    throw err;
  }
}

export async function submitExam(
  userId: string,
  examId: string,
  answers: Record<string, number>,
  timeSpent: number
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the exam and questions
    const { data: exam, error: examError } = await supabase
      .from('practice_exams')
      .select('*, exam_questions(*)')
      .eq('id', examId)
      .single();

    if (examError || !exam) {
      throw new Error('Failed to fetch exam for grading');
    }

    // Calculate score
    let earnedPoints = 0;
    const results: Record<string, boolean> = {};

    exam.exam_questions.forEach((question: any) => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correct_answer;
      results[question.id] = isCorrect;
      
      if (isCorrect) {
        earnedPoints += question.points;
      }
    });

    const score = (earnedPoints / exam.total_points) * 100;

    // Save submission
    const { data: submission, error: submissionError } = await supabase
      .from('exam_submissions')
      .insert({
        exam_id: examId,
        user_id: userId,
        answers: answers,
        score: score,
        time_spent: timeSpent,
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Error saving exam submission:', submissionError);
      throw new Error('Failed to save exam submission');
    }

    return {
      submission,
      score,
      earnedPoints,
      totalPoints: exam.total_points,
      results,
    };
  } catch (err) {
    console.error('Exception in submitExam:', err);
    throw err;
  }
}

export async function getExamSubmissions(userId: string, examId?: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let query = supabase
      .from('exam_submissions')
      .select('*, practice_exams(title)')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    if (examId) {
      query = query.eq('exam_id', examId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching exam submissions:', error);
      throw new Error('Failed to fetch exam submissions');
    }

    return data || [];
  } catch (err) {
    console.error('Exception in getExamSubmissions:', err);
    throw err;
  }
}

export async function deletePracticeExam(userId: string, examId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Delete questions and submissions (foreign key constraints)
    await supabase.from('exam_questions').delete().eq('exam_id', examId);
    await supabase.from('exam_submissions').delete().eq('exam_id', examId);
    
    // Delete the exam
    const { error } = await supabase
      .from('practice_exams')
      .delete()
      .eq('id', examId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting practice exam:', error);
      throw new Error('Failed to delete practice exam');
    }

    return { success: true };
  } catch (err) {
    console.error('Exception in deletePracticeExam:', err);
    throw err;
  }
}

// ============================================================================
// SAVED MESSAGES
// ============================================================================

export async function saveChatMessage(
  userId: string,
  data: {
    message_content: string;
    session_id?: string;
    tags?: string[];
  }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: savedMessage, error } = await supabase
      .from('saved_messages')
      .insert({
        user_id: userId,
        message_content: data.message_content,
        session_id: data.session_id,
        tags: data.tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving message:', error);
      throw new Error('Failed to save message');
    }

    return savedMessage;
  } catch (err) {
    console.error('Exception in saveChatMessage:', err);
    throw err;
  }
}

export async function getSavedMessages(userId: string, tags?: string[]) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let query = supabase
      .from('saved_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching saved messages:', error);
      throw new Error('Failed to fetch saved messages');
    }

    return data || [];
  } catch (err) {
    console.error('Exception in getSavedMessages:', err);
    throw err;
  }
}

export async function deleteSavedMessage(userId: string, messageId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('saved_messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting saved message:', error);
      throw new Error('Failed to delete saved message');
    }

    return { success: true };
  } catch (err) {
    console.error('Exception in deleteSavedMessage:', err);
    throw err;
  }
}

// ============================================================================
// GENERIC ACTIONS
// ============================================================================

export async function toggleFavoriteStatus(
  userId: string,
  itemId: string,
  type: 'summary' | 'flashcard_set' | 'quiz' | 'study_plan' | 'practice_exam',
  currentStatus: boolean
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const tableMap = {
      summary: 'summaries',
      flashcard_set: 'flashcard_sets',
      quiz: 'quizzes',
      study_plan: 'study_plans',
      practice_exam: 'practice_exams',
    };

    const tableName = tableMap[type];
    
    const { data, error } = await supabase
      .from(tableName)
      .update({ is_favorite: !currentStatus })
      .eq('id', itemId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling favorite:', error);
      throw new Error('Failed to toggle favorite');
    }

    return data;
  } catch (err) {
    console.error('Exception in toggleFavoriteStatus:', err);
    throw err;
  }
}

export async function updateLastViewed(
  userId: string,
  itemId: string,
  type: 'summary' | 'flashcard_set' | 'quiz' | 'study_plan' | 'practice_exam'
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const tableMap = {
      summary: 'summaries',
      flashcard_set: 'flashcard_sets',
      quiz: 'quizzes',
      study_plan: 'study_plans',
      practice_exam: 'practice_exams',
    };

    const tableName = tableMap[type];
    
    const { error } = await supabase
      .from(tableName)
      .update({ last_viewed_at: new Date().toISOString() })
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating last viewed:', error);
      // Don't throw error for this non-critical operation
    }

    return { success: true };
  } catch (err) {
    console.error('Exception in updateLastViewed:', err);
    // Don't throw error for this non-critical operation
    return { success: false };
  }
}

export async function publishAsBlog(
  userId: string,
  contentId: string,
  type: 'summary' | 'study_plan',
  blogData: {
    title?: string;
    description?: string;
  }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const tableMap = {
      summary: 'summaries',
      study_plan: 'study_plans',
    };

    const tableName = tableMap[type];
    
    // Generate a unique slug
    const slug = `${type}-${contentId.slice(0, 8)}-${Date.now()}`;
    
    const updates: any = {
      is_public: true,
      slug: slug,
    };

    if (blogData.title) {
      updates.title = blogData.title;
    }

    if (blogData.description) {
      updates.description = blogData.description;
    }

    const { data, error } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', contentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error publishing as blog:', error);
      throw new Error('Failed to publish as blog');
    }

    return data;
  } catch (err) {
    console.error('Exception in publishAsBlog:', err);
    throw err;
  }
}

// ============================================================================
// CHAT DELETION (for chat sessions)
// ============================================================================

export async function deleteChat(userId: string, sessionId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting chat session:', error);
      throw new Error('Failed to delete chat session');
    }

    return { success: true };
  } catch (err) {
    console.error('Exception in deleteChat:', err);
    throw err;
  }
}
