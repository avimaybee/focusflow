-- Add persona tracking to chat_messages
-- This allows us to detect when personas switch mid-conversation

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS persona_id TEXT;

-- Create index for persona filtering
CREATE INDEX IF NOT EXISTS idx_chat_messages_persona_id 
ON public.chat_messages(persona_id);

-- Add comment
COMMENT ON COLUMN public.chat_messages.persona_id IS 
'The ID of the persona that generated this message (for model messages) or was active when the user sent the message';
