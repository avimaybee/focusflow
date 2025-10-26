-- Quick verification queries for personas table
-- Run these in Supabase SQL Editor after migration

-- 1. Check all personas are created
SELECT id, display_name, avatar_emoji, is_active 
FROM personas 
ORDER BY sort_order;

-- Expected: 10 rows
-- gurt, eli5, straight-shooter, essay-writer, in-depth-explainer,
-- sassy-eva, brainstormer, memory-coach, coding-guru, exam-strategist

-- 2. Verify Gurt (default persona)
SELECT * FROM personas WHERE id = 'gurt';

-- Expected: Should show Gurt with prompt containing "who are you?" easter egg

-- 3. Count active personas
SELECT COUNT(*) as active_persona_count 
FROM personas 
WHERE is_active = TRUE;

-- Expected: 10

-- 4. Check personality traits
SELECT id, display_name, personality_traits 
FROM personas 
ORDER BY sort_order;

-- Expected: Each persona should have 3-6 traits

-- 5. Verify Sassy Eva has modern personality
SELECT id, display_name, prompt 
FROM personas 
WHERE id = 'sassy-eva';

-- Expected: Prompt should contain "bestie", "slay", emoji references

-- 6. Test persona retrieval (as would be done by app)
SELECT id, name, display_name, prompt, avatar_emoji
FROM personas
WHERE id = 'coding-guru' AND is_active = TRUE;

-- Expected: CodeMaster details with code block instructions

-- 7. Check all personas have prompts
SELECT id, display_name, LENGTH(prompt) as prompt_length
FROM personas
ORDER BY sort_order;

-- Expected: All prompts should be 200+ characters

-- 8. Verify no duplicate IDs
SELECT id, COUNT(*) as count
FROM personas
GROUP BY id
HAVING COUNT(*) > 1;

-- Expected: 0 rows (no duplicates)

-- 9. Check sort order is sequential
SELECT id, sort_order 
FROM personas 
ORDER BY sort_order;

-- Expected: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

-- 10. Sample persona for testing
SELECT 
    id,
    display_name,
    LEFT(description, 50) as description_preview,
    avatar_emoji,
    is_active
FROM personas
WHERE id IN ('gurt', 'sassy-eva', 'coding-guru')
ORDER BY sort_order;

-- Expected: 3 rows with distinct personalities
