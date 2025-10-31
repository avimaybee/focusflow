import { describe, it, expect, vi } from 'vitest';
import {
  summarizeNotesTool,
  createStudyPlanTool,
  createFlashcardsTool,
  createQuizTool,
  explainConceptTool,
} from './tools';

vi.mock('@/lib/gemini-client', () => ({
  geminiClient: {
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn().mockImplementation(async (prompt) => {
        if (prompt.includes('summarizing educational notes')) {
          return { response: { text: () => JSON.stringify({ summary: 'This is a mocked summary that is upgraded to use Supabase.' }) } };
        }
        if (prompt.includes('expert in creating educational study plans')) {
          return { response: { text: () => JSON.stringify({ title: 'Under Construction' }) } };
        }
        if (prompt.includes('expert in creating educational flashcards')) {
          return { response: { text: () => JSON.stringify({ flashcards: [] }) } };
        }
        if (prompt.includes('expert in creating educational quizzes')) {
          return { response: { text: () => JSON.stringify({ quiz: { title: 'Under Construction' } }) } };
        }
        if (prompt.includes('expert in explaining complex concepts simply')) {
          return { response: { text: () => JSON.stringify({ explanation: 'This feature is under construction.' }) } };
        }
        return { response: { text: () => '{}' } };
      }),
    })),
  },
  DEFAULT_CHAT_MODEL: 'gemini-2.5-flash',
}));

describe('AI Tools (Placeholders)', () => {
  it('summarizeNotesTool should return an under construction message', async () => {
    const result = await summarizeNotesTool({ notes: 'This is a sufficiently long note to pass the validation check.' });
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
