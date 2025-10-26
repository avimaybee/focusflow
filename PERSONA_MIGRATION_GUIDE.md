# Persona System Migration Guide

## Running the Migration

Since this is a Cloudflare Pages deployment with hosted Supabase, you'll need to run the migration directly on your Supabase dashboard.

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your FocusFlow project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Copy the contents of `supabase/migrations/04_create_personas_table.sql`
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify**
   - Go to "Table Editor"
   - You should see a new `personas` table with 10 rows
   - Check that all personas (Gurt, ELI5, Sassy Eva, etc.) are present

### Alternative: Use Supabase CLI with Cloud Link

If you have Supabase project ref:
```powershell
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

## New Persona IDs

The following personas have been created:
- `gurt` - Default helpful guide
- `eli5` - Explain Like I'm 5
- `straight-shooter` - Direct answers only
- `essay-writer` - Academic essays (600 words default)
- `in-depth-explainer` - Deep understanding
- `sassy-eva` - Fun, sassy teaching
- `brainstormer` - Creative ideation
- `memory-coach` - Speed memorization
- `coding-guru` - Programming mentor
- `exam-strategist` - Test-taking expert

## Code Changes Made

### Files Updated:
1. ✅ `src/lib/persona-actions.ts` - New server actions for database personas
2. ✅ `src/ai/flows/chat-flow.ts` - Uses database personas instead of hardcoded
3. ✅ `src/hooks/use-persona-manager.ts` - Fetches personas from database
4. ✅ `src/lib/constants.ts` - Updated PersonaIDs to match new personas
5. ✅ `supabase/migrations/04_create_personas_table.sql` - Database migration

### Architecture Changes:
- **Before**: Hardcoded personas in `lib/personas.ts`, imported everywhere
- **After**: Database-driven, fetched via server actions, centralized

### Benefits:
- ✅ No more client/server confusion
- ✅ Easy to update personas without code deployment
- ✅ Centralized persona management
- ✅ Admin capability for future persona editing
- ✅ Better type safety with Supabase types
