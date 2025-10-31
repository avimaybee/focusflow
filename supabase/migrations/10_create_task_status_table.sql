-- Create study_plan_task_status table for tracking task completion
CREATE TABLE IF NOT EXISTS public.study_plan_task_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.study_plans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plan_id, task_id)
);

-- Enable RLS
ALTER TABLE public.study_plan_task_status ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own task statuses"
    ON public.study_plan_task_status FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task statuses"
    ON public.study_plan_task_status FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task statuses"
    ON public.study_plan_task_status FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task statuses"
    ON public.study_plan_task_status FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_task_status_plan_id ON public.study_plan_task_status(plan_id);
CREATE INDEX IF NOT EXISTS idx_task_status_user_id ON public.study_plan_task_status(user_id);
