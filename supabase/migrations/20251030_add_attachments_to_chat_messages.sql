-- Add attachments support to chat_messages table
-- This migration adds a JSON column to store file attachments (images, PDFs, etc.)

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Add a comment explaining the attachments column structure
COMMENT ON COLUMN public.chat_messages.attachments IS 
'Array of attachment objects. Each object contains: { "url": "gemini-file-uri", "name": "display-name", "mimeType": "image/png", "sizeBytes": "12345" }';

-- Create an index on attachments for queries filtering by attachment presence
CREATE INDEX IF NOT EXISTS idx_chat_messages_has_attachments 
ON public.chat_messages ((attachments <> '[]'::jsonb)) 
WHERE attachments <> '[]'::jsonb;
