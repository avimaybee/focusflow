-- Create user_notes table
CREATE TABLE IF NOT EXISTS public.user_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for user_notes
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notes" ON public.user_notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON public.user_notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.user_notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.user_notes;

-- Create policies for user_notes
CREATE POLICY "Users can view their own notes" ON public.user_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notes" ON public.user_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.user_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.user_notes FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON public.user_notes(user_id);

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_notes_updated_at ON public.user_notes;
CREATE TRIGGER update_user_notes_updated_at
    BEFORE UPDATE ON public.user_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
