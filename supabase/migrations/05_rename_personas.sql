-- Rename personas: update display_name only (ids unchanged)
-- Safe UI-only change; prompts and canonical names remain as-is

BEGIN;

UPDATE public.personas SET display_name = 'Gurt — Your Study Bestie' WHERE id = 'gurt';
UPDATE public.personas SET display_name = 'Snack-Size Sage (ELI5)' WHERE id = 'eli5';
UPDATE public.personas SET display_name = 'No Cap Answers' WHERE id = 'straight-shooter';
UPDATE public.personas SET display_name = 'Essay Glow-Up' WHERE id = 'essay-writer';
UPDATE public.personas SET display_name = 'Lore Drop (Deep Dive)' WHERE id = 'in-depth-explainer';
UPDATE public.personas SET display_name = 'Tea Time Tutor (Sassy)' WHERE id = 'sassy-eva';
UPDATE public.personas SET display_name = 'Cook Mode (Brainstorm)' WHERE id = 'brainstormer';
UPDATE public.personas SET display_name = 'Clutch Recall (Memory Coach)' WHERE id = 'memory-coach';
UPDATE public.personas SET display_name = 'Ship It Sensei' WHERE id = 'coding-guru';
UPDATE public.personas SET display_name = 'Final Boss Coach' WHERE id = 'exam-strategist';

COMMIT;
