# Personas - Single Source of Truth

This file consolidates all persona-related documentation previously scattered across the repo.
It contains the canonical list of personas (ids, display names, human names), migration notes,
development references, and quick steps for adding or updating personas.

## Overview

FocusFlow stores AI personas in a Supabase `personas` table and exposes them through server actions
(`src/lib/persona-actions.ts`). Clients use the `use-persona-manager` hook to fetch and cache persona
data. The goal is: update personas in the DB without code redeploys and keep a single canonical
reference for developers and operators.

Files of interest
- `supabase/migrations/04_create_personas_table.sql` — migration that creates the `personas` table
- `src/lib/persona-actions.ts` — server actions (getPersonas, getPersonaById, getDefaultPersona, etc.)
- `src/hooks/use-persona-manager.ts` — client hook used by UI components
- `src/lib/constants.ts` — `PersonaIDs` constant used across the codebase
- `src/types/chat-types.ts` — `validPersonas` list and persona-related types

## Canonical List of Personas

The table below is the single reference for persona ids, display names, and the assigned human-name
that is injected or referenced in the persona prompts (if applicable).

**IMPORTANT**: After running the ID migration (06_update_persona_ids_and_names.sql), the IDs changed
to display-friendly format. The table below reflects the current state after that migration.

| id (primary key) | display_name | human_name | short description |
|------------------|--------------|------------|-------------------|
| Gurt | Gurt - The Guide | Gurt | Friendly default guide; versatile conversational assistant. |
| Im a baby | ELI5 - The Simplifier | Milo | Explains concepts simply, like you're 5. Playful analogies. |
| straight shooter | The Direct Answer | Frank | Concise no-nonsense answers (1–2 sentences). |
| essay writer | The Academic Wordsmith | Clairo | Academic, structured writing (600-word default). |
| lore master | The Understanding Builder | Syd | Thorough explanations designed for retention. |
| sassy tutor | The Fun Diva Teacher | Lexi | Energetic, Gen Z style, emoji-forward teaching voice. |
| idea cook | The Creative Catalyst | The Chef | Generates multiple creative ideas and categories them. |
| memory coach | The Speed Learner | Remi | Mnemonics, memory palace, rapid memorization. |
| code nerd | The Programming Mentor | Dex | Programming mentor; always uses code blocks. |
| exam strategist | The Exam Strategist | Theo | Exam strategies, time management, and stress reduction. |

Notes:
- `id` is the persona primary key and used in chat messages and user preferences. Do not change ids
  lightly; instead add a new persona and migrate if you must rename keys.
- `human_name` is used in the persona prompt to make the persona self-referential (e.g., "You are [Name]").

## Migration & Deployment Notes

The migration that created the personas is at:

```
supabase/migrations/04_create_personas_table.sql
```

If you need to run the migration:
1. Open Supabase dashboard → SQL editor and paste the SQL file, or
2. Use the Supabase CLI to push migrations (if your project is linked):

```powershell
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

After running the migration, verify there are 10 rows in `personas` and that `is_active = true`.

### Important: persona id renames

Changing persona primary keys is a breaking operation for existing chats and saved preferences.
Recommended strategy when renaming:

1. Create a new persona row with the new id and the updated prompt.
2. Keep the old persona row for backward compatibility (or write a data migration that updates
   chat rows and preferences to the new id atomically).
3. Once migration is validated and no references remain to the old id, you can remove the old row.

## Where code expects personas (quick map)

- Server actions: `src/lib/persona-actions.ts` — central access to DB personas.
- Chat flow (server): `src/ai/flows/chat-flow.ts` — selects persona prompt for system messages.
- Client hook: `src/hooks/use-persona-manager.ts` — fetches and caches personas for UI.
- Constants: `src/lib/constants.ts` — `PersonaIDs` used to avoid hard-coded strings.
- Types: `src/types/chat-types.ts` — `validPersonas` and default persona shape.
- UI components:
  - `src/components/chat/persona-selector.tsx` — visual selector used in chat and landing demo
  - `src/components/chat/multimodal-input.tsx` — integrated into the chat input
  - `src/components/landing/landing-page-chat-v2.tsx` — demo widget that can select a persona

## How to add or update a persona (developer checklist)

1. Add persona to the database (recommended via SQL migration / dashboard):

```sql
INSERT INTO personas (id, name, display_name, description, prompt, avatar_emoji, personality_traits, is_active, sort_order)
VALUES (
  'new-persona',
  'New Persona',
  'New Persona',
  'Short description',
  'You are New Persona. You are [Human Name]...',
  '🆕',
  ARRAY['trait1','trait2'],
  TRUE,
  11
);
```

2. (Optional but recommended) Add the id to `src/lib/constants.ts` as a new key in `PersonaIDs`.
3. Add the id to `src/types/chat-types.ts` `validPersonas` array (keeps TypeScript strict).
4. If you want the persona to be available immediately in the UI, ensure `sort_order` and `is_active`
   are set appropriately.
5. Add any documentation you want to the `human_name` or `prompt` field in the DB so marketing or
   support can reference it.

## Verification SQL (run after migration)

```sql
SELECT id, display_name, avatar_emoji, is_active, sort_order FROM public.personas ORDER BY sort_order;
SELECT COUNT(*) FROM public.personas WHERE is_active = TRUE;
```

## Troubleshooting

- If personas don't load in the UI, check server logs and verify `getPersonas()` returns rows.
- If chat responses use the wrong persona, confirm chat messages store `persona_id` in message rows and
  that `chat-flow` reads the `persona_id` and resolves to `persona.prompt`.
- If you need to revert a persona change, re-insert the previous row with the previous id and prompt
  and update any preferences back to the old id.

## Contacts & Next steps

- If you plan a persona rename, coordinate with product and support to avoid confusing users.
- Consider adding a small admin UI in future to edit persona rows and preview prompts before pushing to prod.

---

This file replaces other persona-focused docs and is the canonical reference for persona ids, names,
and migration instructions. If you need to add long-form marketing content or persona storytelling, put
that content under `docs/persona-story/` (not created by this change).
