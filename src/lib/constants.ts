/**
 * @fileoverview Centralized constants for the application.
 * Using constants for string literals helps prevent typos and makes refactoring easier.
 */

export const PersonaIDs = {
  AUTO: 'Auto',
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

export const SmartToolActions = {
  REWRITE: 'rewrite',
  BULLET_POINTS: 'bulletPoints',
  COUNTERARGUMENTS: 'counterarguments',
  INSIGHTS: 'insights',
} as const;
