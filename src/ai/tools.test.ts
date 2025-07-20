import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  summarizeNotesTool,
  createStudyPlanTool,
  createFlashcardsTool,
  createQuizTool,
  explainConceptTool,
} from './tools';
import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Mock Genkit AI
vi.mock('@/ai/genkit', () => ({
  ai: {
    defineTool: vi.fn((config, handler) => {
      // Store the handler to be tested separately
      (config as any).handler = handler;
      return config;
    }),
    generate: vi.fn(),
  },
}));

// Mock Firebase Admin
vi.mock('@/lib/firebase-admin', () => ({
  db: {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    get: vi.fn(),
    update: vi.fn(),
  },
  // This is needed to mock FieldValue.increment
  FieldValue: {
    increment: vi.fn(val => ({
        _operand: val,
        isEqual: (other: any) => other._operand === val,
    })),
  },
}));

describe('AI Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for a non-premium user with usage left
    (db.get as vi.Mock).mockResolvedValue({
      exists: true,
      data: () => ({ isPremium: false, usage: { summaries: 1 } }),
    });
  });

  describe('summarizeNotesTool', () => {
    it('should be defined with correct properties', () => {
      expect(summarizeNotesTool.name).toBe('summarizeNotesTool');
      expect(summarizeNotesTool.description).toBeDefined();
      expect(summarizeNotesTool.inputSchema).toBeDefined();
      expect(summarizeNotesTool.outputSchema).toBeDefined();
    });

    it('should call generate with the correct prompt', async () => {
      const handler = (summarizeNotesTool as any).handler;
      const input = { notes: 'This is a test note.' };
      const context = { auth: { uid: 'test-user' } };
      
      (ai.generate as vi.Mock).mockResolvedValue({ output: { summary: 'Test summary' } });

      await handler(input, context);

      expect(ai.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining(input.notes),
        })
      );
    });

    it('should check and increment usage', async () => {
        const handler = (summarizeNotesTool as any).handler;
        const input = { notes: 'This is a test note.' };
        const context = { auth: { uid: 'test-user' } };
        
        await handler(input, context);

        expect(db.doc).toHaveBeenCalledWith('test-user');
        expect(db.update).toHaveBeenCalledWith({ 'usage.summaries': FieldValue.increment(1) });
    });
  });

  describe('createFlashcardsTool', () => {
    it('should be defined with correct properties', () => {
      expect(createFlashcardsTool.name).toBe('createFlashcardsTool');
    });

    it('should throw an error if usage limit is reached', async () => {
        const handler = (createFlashcardsTool as any).handler;
        const input = { topic: 'History', count: 5 };
        const context = { auth: { uid: 'test-user' } };

        // Mock user has reached their limit for flashcards
        (db.get as vi.Mock).mockResolvedValueOnce({
            exists: true,
            data: () => ({ isPremium: false, usage: { flashcardSets: 3 } }),
        });

        await expect(handler(input, context)).rejects.toThrow(
            'You have reached your monthly limit for flashcardSets. Please upgrade to Premium for unlimited access.'
        );
    });
  });
  
  describe('explainConceptTool', () => {
    it('should be defined correctly and not check usage', async () => {
        const handler = (explainConceptTool as any).handler;
        const input = { concept: 'Quantum Physics' };
        const context = { auth: { uid: 'test-user' } };

        expect(explainConceptTool.name).toBe('explainConceptTool');
        
        await handler(input, context);

        // Should not check usage for this free tool
        expect(db.get).not.toHaveBeenCalled();
    });
  });
});
