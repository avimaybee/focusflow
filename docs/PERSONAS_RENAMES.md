# Persona rename rollout (UI labels only)

This update refreshes persona display names to feel more current and fun for Gen Z users while keeping IDs and prompts stable. Only `display_name` was changed via migration `05_rename_personas.sql`. Canonical `id` and `name` remain unchanged.

## Old → New display names

- gurt: "Gurt - The Guide" → "Gurt — Your Study Bestie"
- eli5: "ELI5 - The Simplifier" → "Snack-Size Sage (ELI5)"
- straight-shooter: "The Direct Answer" → "No Cap Answers"
- essay-writer: "The Academic Wordsmith" → "Essay Glow-Up"
- in-depth-explainer: "The Understanding Builder" → "Lore Drop (Deep Dive)"
- sassy-eva: "The Fun Diva Teacher" → "Tea Time Tutor (Sassy)"
- brainstormer: "The Creative Catalyst" → "Cook Mode (Brainstorm)"
- memory-coach: "The Speed Learner" → "Clutch Recall (Memory Coach)"
- coding-guru: "The Programming Mentor" → "Ship It Sensei"
- exam-strategist: "The Exam Strategist" → "Final Boss Coach"

## Alternates we considered

- gurt: "Gurt, Study Bestie"; "Gurt Prime"
- eli5: "Lil' Sage (ELI5)"; "Tiny Teacher (ELI5)"
- straight-shooter: "No Fluff, No Cap"; "Facts Only"
- essay-writer: "A+ Essay Forge"; "No‑Fluff Scribe"
- in-depth-explainer: "Deep Dive Lorekeeper"; "Lore Master"
- sassy-eva: "Clapback Coach (Sassy)"; "Slay Tutor"
- brainstormer: "Spark Factory"; "Idea Kitchen (We Cook)"
- memory-coach: "Sticky Brain Lab"; "Recall Gains"
- coding-guru: "Bug Slayer"; "Git Wizard"
- exam-strategist: "Clutch Coach (Exams)"; "Finals Ops"

## Rationale and references

We anchored labels in widely used, recently documented slang and internet vernacular. Citations below show meaning and currency (2024–2025):

- "no cap" (truthful; no exaggeration): Merriam‑Webster, NO CAP (Last Updated: 23 Jan 2025) — https://www.merriam-webster.com/slang/no-cap
- "glow‑up" (dramatic positive transformation): Merriam‑Webster, GLOW‑UP (Last Updated: 23 Jan 2025) — https://www.merriam-webster.com/slang/glow-up
- "clap back" (sharp, witty response): Merriam‑Webster, CLAP BACK — https://www.merriam-webster.com/dictionary/clap%20back
- "tea / spill the tea" (inside info, gossip): Merriam‑Webster, TEA (phrase: spill the tea) — https://www.merriam-webster.com/dictionary/spill%20the%20tea
- "clutch" (performing in crucial moments): Merriam‑Webster, CLUTCH (adjective/noun sense) — https://www.merriam-webster.com/dictionary/clutch#h3
- "rizz" (charisma/charm; cultural tone reference): Merriam‑Webster, RIZZ (Last Updated: 4 Mar 2025) — https://www.merriam-webster.com/slang/rizz

Notes:
- We intentionally avoided offensive/derogatory slang and used playful, positive terms.
- Some names (e.g., "Cook Mode") nod to current memes ("let him cook") without depending on them semantically in‑app.
- Only UI labels were changed; prompts weren’t altered to preserve persona behavior and tests.

## Rollout

1) Run the migration on your Supabase project (SQL Editor): `05_rename_personas.sql`.
2) No code changes required — UI reads `display_name` from DB.
3) If you later want prompts to reflect the new labels, do a follow‑up content pass to refresh opening lines inside `prompt` for each persona.
