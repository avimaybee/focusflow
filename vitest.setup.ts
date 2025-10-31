import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Set up mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'your-anon-key';
process.env.GEMINI_API_KEY = 'your-gemini-api-key';

vi.mock('@google/generative-ai', () => {
    const mockChat = {
      sendMessage: vi.fn().mockResolvedValue({
        response: {
          text: () => 'This is a mocked chat response.',
        },
      }),
    };

    const mockModel = {
      startChat: vi.fn(() => mockChat),
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            summary: 'This is a mocked summary that is upgraded to use Supabase.',
            title: 'Under Construction',
            flashcards: [],
            quiz: { title: 'Under Construction' },
            explanation: 'This feature is under construction.',
          }),
        },
      }),
    };

    const mockGenerativeAI = {
      getGenerativeModel: vi.fn(() => mockModel),
      chats: {
        create: vi.fn(() => mockChat),
      }
    };

    return {
      GoogleGenerativeAI: vi.fn(() => mockGenerativeAI),
      HarmCategory: {},
      HarmBlockThreshold: {},
    };
  });

  vi.mock('@supabase/supabase-js', () => {
    const mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: '1', name: 'Default', prompt: 'You are a helpful AI assistant.' }, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockReturnThis(),
    };

    mockQueryBuilder.insert.mockImplementation(() => ({
      ...mockQueryBuilder,
      select: vi.fn(() => ({
        ...mockQueryBuilder,
        single: vi.fn().mockResolvedValue({ data: { id: 'new-session-id' }, error: null }),
      })),
    }));

    const mockSupabaseClient = {
      from: vi.fn(() => mockQueryBuilder),
    };

    return {
      createClient: vi.fn(() => mockSupabaseClient),
    };
  });

  vi.mock('@/lib/gemini-client', async () => {
    const original = await vi.importActual('@/lib/gemini-client');
    return {
      ...original,
      createChatSession: vi.fn(() => ({
        sendMessage: vi.fn().mockResolvedValue({
          response: {
            text: () => 'This is a mocked chat response.',
          },
        }),
      })),
    };
  });
