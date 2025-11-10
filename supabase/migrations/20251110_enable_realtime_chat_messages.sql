-- Enable Realtime for chat_messages table (safe version)
--
-- Use a DO block to conditionally create the publication and add the
-- table to the publication. Postgres does not support `ALTER PUBLICATION
-- ... ADD TABLE IF NOT EXISTS` syntax, which caused the original error.
-- This script is safe to run multiple times.

DO $$
BEGIN
  -- Create the publication if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add table to publication if not already included
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END
$$;

-- Ensure the table provides full row data in replication events
ALTER TABLE IF EXISTS public.chat_messages REPLICA IDENTITY FULL;

-- Add an explanatory comment (idempotent)
COMMENT ON TABLE public.chat_messages IS
  'Chat messages with Realtime enabled for instant message delivery. '
  'Clients subscribe to INSERT events filtered by session_id to receive '
  'messages as they are created.';
