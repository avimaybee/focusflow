/**
 * @fileoverview Centralized constants for the application.
 * Using constants for string literals helps prevent typos and makes refactoring easier.
 *
 * NOTE: PersonaIDs have been moved to `src/types/persona.ts` as PERSONA_IDS.
 * For backwards compatibility, this file re-exports them here.
 * New code should import from `src/types/persona.ts` directly.
 */

import { PERSONA_IDS } from '@/types/persona';

/**
 * @deprecated Use PERSONA_IDS from '@/types/persona' instead.
 * Kept for backwards compatibility only.
 */
export const PersonaIDs = PERSONA_IDS;

export const SmartToolActions = {
  REWRITE: 'rewrite',
  BULLET_POINTS: 'bulletPoints',
  COUNTERARGUMENTS: 'counterarguments',
  INSIGHTS: 'insights',
} as const;
