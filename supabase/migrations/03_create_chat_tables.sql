-- Create chat_sessions table
CREATE TABLE public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own chat sessions" ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own chat sessions" ON public.chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chat sessions" ON public.chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chat sessions" ON public.chat_sessions FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their own chat sessions" ON public.chat_messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.chat_sessions
        WHERE id = session_id AND auth.uid() = user_id
    )
);
CREATE POLICY "Users can insert messages in their own chat sessions" ON public.chat_messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chat_sessions
        WHERE id = session_id AND auth.uid() = user_id
    )
);