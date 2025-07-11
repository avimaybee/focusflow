/**
 * @fileoverview Centralized constants for the application.
 * Using constants for string literals helps prevent typos and makes refactoring easier.
 */

export const PersonaIDs = {
  NEUTRAL: 'neutral',
  FIVE_YEAR_OLD: 'five-year-old',
  CASUAL: 'casual',
  ENTERTAINING: 'entertaining',
  BRUTALLY_HONEST: 'brutally-honest',
  STRAIGHT_SHOOTER: 'straight-shooter',
  ESSAY_SHARPSHOOTER: 'essay-sharpshooter',
  IDEA_GENERATOR: 'idea-generator',
  CRAM_BUDDY: 'cram-buddy',
  SASSY: 'sassy',
} as const;

export const SmartToolActions = {
  REWRITE: 'rewrite',
  BULLET_POINTS: 'bulletPoints',
  COUNTERARGUMENTS: 'counterarguments',
  PRESENTATION: 'presentation',
  INSIGHTS: 'insights',
} as const;
