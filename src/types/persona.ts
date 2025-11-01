/**
 * @fileoverview Unified persona type definitions and constants.
 * This is the single source of truth for persona data structure.
 * All code should import from here, not duplicate type definitions elsewhere.
 */

/**
 * Complete persona data structure as it comes from the API/database.
 * Matches the Supabase `public.personas` table schema after conversion.
 */
export interface Persona {
  id: string;
  name: string;
  displayName: string;
  description: string;
  prompt: string;
  avatarUrl: string | null;
  avatarEmoji: string | null;
  sortOrder: number;
}

/**
 * Minimal persona data for UI display (e.g., persona selector).
 * Subset of Persona with only fields needed for rendering.
 */
export interface PersonaPreview {
  id: string;
  displayName: string;
  description: string;
  avatarUrl: string | null;
  avatarEmoji: string | null;
}

/**
 * Database row schema from Supabase (snake_case).
 * Used internally by API routes to validate responses.
 */
export interface PersonaDatabaseRow {
  id: string;
  name: string;
  display_name: string;
  description: string;
  prompt: string;
  avatar_url: string | null;
  avatar_emoji: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

/**
 * Convert database row (snake_case) to internal Persona format (camelCase).
 * Used by API routes after fetching from Supabase.
 */
export function convertDatabaseRowToPersona(row: PersonaDatabaseRow): Persona {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    description: row.description,
    prompt: row.prompt,
    avatarUrl: row.avatar_url,
    avatarEmoji: row.avatar_emoji,
    sortOrder: row.sort_order ?? 0,
  };
}

/**
 * Canonical persona IDs: hardcoded strings that must match database IDs.
 * When adding a new persona:
 * 1. Add a new entry to PERSONA_IDS below
 * 2. Insert it into the Supabase `public.personas` table
 * 3. That's it — no other code changes needed (the IDs are inferred from DB)
 */
export const PERSONA_IDS = {
  GURT: 'Gurt',
  IM_A_BABY: 'Im a baby',
  STRAIGHT_SHOOTER: 'straight shooter',
  ESSAY_WRITER: 'essay writer',
  LORE_MASTER: 'lore master',
  SASSY_TUTOR: 'sassy tutor',
  IDEA_COOK: 'idea cook',
  MEMORY_COACH: 'memory coach',
  CODE_NERD: 'code nerd',
  EXAM_STRATEGIST: 'exam strategist',
} as const;

/**
 * Type-safe persona ID type derived from PERSONA_IDS.
 * Ensures only valid IDs are used throughout the codebase.
 */
export type PersonaID = (typeof PERSONA_IDS)[keyof typeof PERSONA_IDS];

/**
 * Array of valid persona IDs for runtime validation (e.g., Zod schemas).
 * Used to validate incoming persona selections.
 */
export const validPersonaIDs = [
  'Gurt',
  'Im a baby',
  'straight shooter',
  'essay writer',
  'lore master',
  'sassy tutor',
  'idea cook',
  'memory coach',
  'code nerd',
  'exam strategist',
] as const;

/**
 * Default persona used when no persona is selected.
 */
export const DEFAULT_PERSONA_ID: PersonaID = PERSONA_IDS.GURT;
