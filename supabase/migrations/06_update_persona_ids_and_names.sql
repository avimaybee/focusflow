-- Migration: Update persona IDs and add human names to prompts
-- This migration changes the primary key IDs to simpler format and prepends
-- human name identity to each persona's system prompt.
--
-- IMPORTANT: This will break existing chat sessions that reference old IDs.
-- Run this migration on a fresh database or ensure you migrate existing chat data.

BEGIN;

-- Step 1: Create temporary table with new data structure
CREATE TEMP TABLE new_personas AS
SELECT 
  CASE id
    WHEN 'gurt' THEN 'Gurt'
    WHEN 'eli5' THEN 'Im a baby'
    WHEN 'straight-shooter' THEN 'straight shooter'
    WHEN 'essay-writer' THEN 'essay writer'
    WHEN 'in-depth-explainer' THEN 'lore master'
    WHEN 'sassy-eva' THEN 'sassy tutor'
    WHEN 'brainstormer' THEN 'idea cook'
    WHEN 'memory-coach' THEN 'memory coach'
    WHEN 'coding-guru' THEN 'code nerd'
    WHEN 'exam-strategist' THEN 'exam strategist'
  END as new_id,
  CASE id
    WHEN 'gurt' THEN 'You are Gurt. Refer to yourself as "Gurt".' || E'\n\n' || prompt
    WHEN 'eli5' THEN 'You are Milo. Refer to yourself as "Milo".' || E'\n\n' || prompt
    WHEN 'straight-shooter' THEN 'You are Frank. Refer to yourself as "Frank".' || E'\n\n' || prompt
    WHEN 'essay-writer' THEN 'You are Clairo. Refer to yourself as "Clairo".' || E'\n\n' || prompt
    WHEN 'in-depth-explainer' THEN 'You are Syd. Refer to yourself as "Syd".' || E'\n\n' || prompt
    WHEN 'sassy-eva' THEN 'You are Lexi. Refer to yourself as "Lexi".' || E'\n\n' || prompt
    WHEN 'brainstormer' THEN 'You are The Chef. Refer to yourself as "The Chef".' || E'\n\n' || prompt
    WHEN 'memory-coach' THEN 'You are Remi. Refer to yourself as "Remi".' || E'\n\n' || prompt
    WHEN 'coding-guru' THEN 'You are Dex. Refer to yourself as "Dex".' || E'\n\n' || prompt
    WHEN 'exam-strategist' THEN 'You are Theo. Refer to yourself as "Theo".' || E'\n\n' || prompt
  END as new_prompt,
  name,
  display_name,
  description,
  avatar_url,
  avatar_emoji,
  personality_traits,
  is_active,
  sort_order,
  created_at
FROM public.personas;

-- Step 2: Delete old personas
DELETE FROM public.personas;

-- Step 3: Insert personas with new IDs and updated prompts
INSERT INTO public.personas (id, name, display_name, description, prompt, avatar_url, avatar_emoji, personality_traits, is_active, sort_order, created_at, updated_at)
SELECT new_id, name, display_name, description, new_prompt, avatar_url, avatar_emoji, personality_traits, is_active, sort_order, created_at, NOW()
FROM new_personas;

-- Step 4: Drop temp table
DROP TABLE new_personas;

COMMIT;
