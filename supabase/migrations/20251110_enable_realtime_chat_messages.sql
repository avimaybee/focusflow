-- Enable Realtime for chat_messages table
-- This allows the Supabase Realtime service to stream INSERT/UPDATE/DELETE events
-- for chat messages to connected clients via WebSocket

-- Enable realtime for chat_messages if not already enabled
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.chat_messages;

-- Ensure the table has REPLICA IDENTITY FULL for proper realtime updates
-- This ensures all column values are included in realtime events
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- Add comment explaining realtime usage
COMMENT ON TABLE public.chat_messages IS 
  'Chat messages with Realtime enabled for instant message delivery. '
  'Clients subscribe to INSERT events filtered by session_id to receive '
  'messages as they are created.';
