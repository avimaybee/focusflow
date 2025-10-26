/**
 * @fileoverview Centralized constants for the application.
 * Using constants for string literals helps prevent typos and makes refactoring easier.
 */

export const PersonaIDs = {
  GURT: 'gurt',
  ELI5: 'eli5',
  STRAIGHT_SHOOTER: 'straight-shooter',
  ESSAY_WRITER: 'essay-writer',
  IN_DEPTH_EXPLAINER: 'in-depth-explainer',
  SASSY_EVA: 'sassy-eva',
  BRAINSTORMER: 'brainstormer',
  MEMORY_COACH: 'memory-coach',
  CODING_GURU: 'coding-guru',
  EXAM_STRATEGIST: 'exam-strategist',
} as const;

export const SmartToolActions = {
  REWRITE: 'rewrite',
  BULLET_POINTS: 'bulletPoints',
  COUNTERARGUMENTS: 'counterarguments',
  INSIGHTS: 'insights',
} as const;
