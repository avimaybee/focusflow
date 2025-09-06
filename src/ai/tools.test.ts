import { describe, it, expect } from 'vitest';
import {
  summarizeNotesTool,
  createStudyPlanTool,
  createFlashcardsTool,
  createQuizTool,
  explainConceptTool,
} from './tools';

describe('AI Tools (Placeholders)', () => {
  it('summarizeNotesTool should return an under construction message', async () => {
    const result = await summarizeNotesTool({ notes: 'test' });
    expect(result.summary).toContain('upgraded to use Supabase');
  });

  it('createStudyPlanTool should return an under construction message', async () => {
    const result = await createStudyPlanTool({ topic: 'test', durationDays: 1 });
    expect(result.title).toBe('Under Construction');
  });

  it('createFlashcardsTool should return an empty array', async () => {
    const result = await createFlashcardsTool({ topic: 'test', count: 1 });
    expect(result.flashcards).toEqual([]);
  });

  it('createQuizTool should return an under construction message', async () => {
    const result = await createQuizTool({ topic: 'test', questionCount: 1, difficulty: 'easy' });
    expect(result.quiz.title).toBe('Under Construction');
  });

  it('explainConceptTool should return an under construction message', async () => {
    const result = await explainConceptTool({ concept: 'test' });
    expect(result.explanation).toContain('under construction');
  });
});