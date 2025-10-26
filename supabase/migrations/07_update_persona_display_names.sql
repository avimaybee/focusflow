-- Migration: Update persona display names and names to simpler versions
-- Run this after the main persona migration (04_create_personas_table.sql)
-- The 'name' field is used in thinking UI (e.g., "Lexi is thinking...")

UPDATE public.personas SET display_name = 'Gurt', name = 'Gurt' WHERE id = 'Gurt';
UPDATE public.personas SET display_name = 'Im a baby', name = 'Milo' WHERE id = 'Im a baby';
UPDATE public.personas SET display_name = 'straight shooter', name = 'Frank' WHERE id = 'straight shooter';
UPDATE public.personas SET display_name = 'essay writer', name = 'Clairo' WHERE id = 'essay writer';
UPDATE public.personas SET display_name = 'lore master', name = 'Syd' WHERE id = 'lore master';
UPDATE public.personas SET display_name = 'sassy tutor', name = 'Lexi' WHERE id = 'sassy tutor';
UPDATE public.personas SET display_name = 'idea cook', name = 'The Chef' WHERE id = 'idea cook';
UPDATE public.personas SET display_name = 'memory coach', name = 'Remi' WHERE id = 'memory coach';
UPDATE public.personas SET display_name = 'code nerd', name = 'Dex' WHERE id = 'code nerd';
UPDATE public.personas SET display_name = 'exam strategist', name = 'Theo' WHERE id = 'exam strategist';
