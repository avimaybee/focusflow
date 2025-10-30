-- Create summaries table for AI-generated summaries
CREATE TABLE IF NOT EXISTS public.summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    keywords TEXT[],
    is_public BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    slug TEXT UNIQUE,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_viewed_at TIMESTAMPTZ
);

-- Create flashcard_sets table
CREATE TABLE IF NOT EXISTS public.flashcard_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    slug TEXT UNIQUE,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_viewed_at TIMESTAMPTZ
);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id UUID REFERENCES public.flashcard_sets(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    slug TEXT UNIQUE,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_viewed_at TIMESTAMPTZ
);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of options
    correct_answer INTEGER NOT NULL, -- Index of correct option
    explanation TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create study_plans table
CREATE TABLE IF NOT EXISTS public.study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    duration_weeks INTEGER,
    plan_data JSONB NOT NULL, -- Structured plan with weeks/days/topics
    is_public BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    slug TEXT UNIQUE,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_viewed_at TIMESTAMPTZ
);

-- Create practice_exams table
CREATE TABLE IF NOT EXISTS public.practice_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT,
    duration_minutes INTEGER,
    is_public BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    slug TEXT UNIQUE,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_viewed_at TIMESTAMPTZ
);

-- Create exam_questions table
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.practice_exams(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer INTEGER NOT NULL,
    explanation TEXT,
    points INTEGER DEFAULT 1,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exam_submissions table
CREATE TABLE IF NOT EXISTS public.exam_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES public.practice_exams(id) ON DELETE CASCADE,
    answers JSONB NOT NULL, -- User's answers
    score NUMERIC(5,2),
    total_points INTEGER,
    time_taken_minutes INTEGER,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create collection_items table (many-to-many for content in collections)
CREATE TABLE IF NOT EXISTS public.collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('summary', 'flashcard_set', 'quiz', 'study_plan', 'exam')),
    content_id UUID NOT NULL,
    position INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(collection_id, content_type, content_id)
);

-- Create user_goals table
CREATE TABLE IF NOT EXISTS public.user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_type TEXT CHECK (target_type IN ('study_hours', 'quiz_score', 'completion_rate', 'streak_days')),
    target_value NUMERIC(10,2),
    current_value NUMERIC(10,2) DEFAULT 0,
    deadline TIMESTAMPTZ,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create study_activity table for analytics
CREATE TABLE IF NOT EXISTS public.study_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('chat', 'summary', 'flashcard_review', 'quiz_attempt', 'exam_attempt', 'note_created')),
    activity_data JSONB, -- Flexible data per activity type
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_memory table for contextual conversations
CREATE TABLE IF NOT EXISTS public.ai_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL CHECK (memory_type IN ('preference', 'fact', 'context', 'goal')),
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    importance INTEGER DEFAULT 1 CHECK (importance BETWEEN 1 AND 5),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, memory_type, key)
);

-- Create saved_messages table for bookmarked chat messages
CREATE TABLE IF NOT EXISTS public.saved_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_content TEXT NOT NULL,
    source_session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for summaries
CREATE POLICY "Users can view their own summaries" ON public.summaries FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "Users can create their own summaries" ON public.summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own summaries" ON public.summaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own summaries" ON public.summaries FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for flashcard_sets
CREATE POLICY "Users can view their own flashcard sets" ON public.flashcard_sets FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "Users can create their own flashcard sets" ON public.flashcard_sets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own flashcard sets" ON public.flashcard_sets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own flashcard sets" ON public.flashcard_sets FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for flashcards
CREATE POLICY "Users can view flashcards from accessible sets" ON public.flashcards FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.flashcard_sets WHERE id = set_id AND (auth.uid() = user_id OR is_public = TRUE))
);
CREATE POLICY "Users can create flashcards in their own sets" ON public.flashcards FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.flashcard_sets WHERE id = set_id AND auth.uid() = user_id)
);
CREATE POLICY "Users can update flashcards in their own sets" ON public.flashcards FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.flashcard_sets WHERE id = set_id AND auth.uid() = user_id)
);
CREATE POLICY "Users can delete flashcards in their own sets" ON public.flashcards FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.flashcard_sets WHERE id = set_id AND auth.uid() = user_id)
);

-- RLS Policies for quizzes
CREATE POLICY "Users can view their own quizzes" ON public.quizzes FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "Users can create their own quizzes" ON public.quizzes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quizzes" ON public.quizzes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quizzes" ON public.quizzes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for quiz_questions
CREATE POLICY "Users can view questions from accessible quizzes" ON public.quiz_questions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND (auth.uid() = user_id OR is_public = TRUE))
);
CREATE POLICY "Users can create questions in their own quizzes" ON public.quiz_questions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND auth.uid() = user_id)
);
CREATE POLICY "Users can update questions in their own quizzes" ON public.quiz_questions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND auth.uid() = user_id)
);
CREATE POLICY "Users can delete questions in their own quizzes" ON public.quiz_questions FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND auth.uid() = user_id)
);

-- RLS Policies for study_plans
CREATE POLICY "Users can view their own study plans" ON public.study_plans FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "Users can create their own study plans" ON public.study_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own study plans" ON public.study_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own study plans" ON public.study_plans FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for practice_exams
CREATE POLICY "Users can view their own practice exams" ON public.practice_exams FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "Users can create their own practice exams" ON public.practice_exams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own practice exams" ON public.practice_exams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own practice exams" ON public.practice_exams FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for exam_questions
CREATE POLICY "Users can view questions from accessible exams" ON public.exam_questions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.practice_exams WHERE id = exam_id AND (auth.uid() = user_id OR is_public = TRUE))
);
CREATE POLICY "Users can create questions in their own exams" ON public.exam_questions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.practice_exams WHERE id = exam_id AND auth.uid() = user_id)
);
CREATE POLICY "Users can update questions in their own exams" ON public.exam_questions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.practice_exams WHERE id = exam_id AND auth.uid() = user_id)
);
CREATE POLICY "Users can delete questions in their own exams" ON public.exam_questions FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.practice_exams WHERE id = exam_id AND auth.uid() = user_id)
);

-- RLS Policies for exam_submissions
CREATE POLICY "Users can view their own exam submissions" ON public.exam_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own exam submissions" ON public.exam_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for collections
CREATE POLICY "Users can view their own collections" ON public.collections FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "Users can create their own collections" ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own collections" ON public.collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own collections" ON public.collections FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for collection_items
CREATE POLICY "Users can view items in accessible collections" ON public.collection_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.collections WHERE id = collection_id AND (auth.uid() = user_id OR is_public = TRUE))
);
CREATE POLICY "Users can add items to their own collections" ON public.collection_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.collections WHERE id = collection_id AND auth.uid() = user_id)
);
CREATE POLICY "Users can update items in their own collections" ON public.collection_items FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.collections WHERE id = collection_id AND auth.uid() = user_id)
);
CREATE POLICY "Users can delete items from their own collections" ON public.collection_items FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.collections WHERE id = collection_id AND auth.uid() = user_id)
);

-- RLS Policies for user_goals
CREATE POLICY "Users can view their own goals" ON public.user_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own goals" ON public.user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.user_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.user_goals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for study_activity
CREATE POLICY "Users can view their own study activity" ON public.study_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own study activity" ON public.study_activity FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ai_memory
CREATE POLICY "Users can view their own AI memory" ON public.ai_memory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own AI memory" ON public.ai_memory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own AI memory" ON public.ai_memory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own AI memory" ON public.ai_memory FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for saved_messages
CREATE POLICY "Users can view their own saved messages" ON public.saved_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own saved messages" ON public.saved_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own saved messages" ON public.saved_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved messages" ON public.saved_messages FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON public.summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_summaries_slug ON public.summaries(slug) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_user_id ON public.flashcard_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_set_id ON public.flashcards(set_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_user_id ON public.study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_exams_user_id ON public.practice_exams(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON public.exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_user_id ON public.exam_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_exam_id ON public.exam_submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON public.user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_study_activity_user_id ON public.study_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_study_activity_created_at ON public.study_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_memory_user_id ON public.ai_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_messages_user_id ON public.saved_messages(user_id);

-- Triggers for updated_at columns
DROP TRIGGER IF EXISTS update_summaries_updated_at ON public.summaries;
CREATE TRIGGER update_summaries_updated_at BEFORE UPDATE ON public.summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_flashcard_sets_updated_at ON public.flashcard_sets;
CREATE TRIGGER update_flashcard_sets_updated_at BEFORE UPDATE ON public.flashcard_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quizzes_updated_at ON public.quizzes;
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_study_plans_updated_at ON public.study_plans;
CREATE TRIGGER update_study_plans_updated_at BEFORE UPDATE ON public.study_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_practice_exams_updated_at ON public.practice_exams;
CREATE TRIGGER update_practice_exams_updated_at BEFORE UPDATE ON public.practice_exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collections_updated_at ON public.collections;
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_messages_updated_at ON public.saved_messages;
CREATE TRIGGER update_saved_messages_updated_at BEFORE UPDATE ON public.saved_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
