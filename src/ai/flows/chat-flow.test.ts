import { describe, it, expect, vi } from 'vitest';
import { chatFlow } from './chat-flow';

vi.mock('@/lib/supabase', () => {
    const from = vi.fn();

    from.mockImplementation((tableName) => {
      const baseMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'default-persona', prompt: 'You are an assistant.' }, error: null }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { id: 'new-message' }, error: null })
          }))
        }))
      };

      if (tableName === 'chat_sessions') {
        baseMock.insert = vi.fn().mockResolvedValue({ data: [{ id: 'new-session-id' }], error: null });
      }

      return baseMock;
    });

    const mockSupabaseClient = { from };

    return {
      supabase: mockSupabaseClient,
      createSupabaseClient: vi.fn().mockReturnValue(mockSupabaseClient),
      createAuthenticatedSupabaseClient: vi.fn().mockResolvedValue(mockSupabaseClient),
    };
  });

vi.mock('@/lib/gemini-client', () => ({
  createChatSession: vi.fn().mockReturnValue({
    sendMessage: vi.fn(async () => {
        return Promise.resolve({
            text: 'This is a mocked chat response.',
          });
    }),
  }),
  createFileDataPart: vi.fn((uri, mimeType) => ({
    fileData: { fileUri: uri, mimeType },
  })),
  createInlineDataPart: vi.fn((data, mimeType) => ({
    inlineData: { data, mimeType },
  })),
}));

describe('chatFlow', () => {
  it('should return a mocked response', async () => {
    const result = await chatFlow({
      message: 'Hello, world!',
      userId: 'test-user',
      isGuest: false,
    });
    expect(result.response).toBe('This is a mocked chat response.');
  });

  it('should use the provided sessionId', async () => {
    const result = await chatFlow({
      message: 'Hello, again!',
      sessionId: 'existing-session-id',
      userId: 'test-user',
      isGuest: false,
    });
    expect(result.sessionId).toBe('existing-session-id');
    expect(result.response).toBe('This is a mocked chat response.');
  });

  it('should accept file_uri attachments with data field', async () => {
    const result = await chatFlow({
      message: 'Analyze this image',
      userId: 'test-user',
      isGuest: false,
      attachments: [
        {
          type: 'file_uri',
          data: 'https://generativelanguage.googleapis.com/v1beta/files/abc123',
          mimeType: 'image/png',
        },
      ],
    });
    expect(result.response).toBe('This is a mocked chat response.');
  });

  it('should accept inline_data attachments with data field', async () => {
    const result = await chatFlow({
      message: 'Analyze this content',
      userId: 'test-user',
      isGuest: false,
      attachments: [
        {
          type: 'inline_data',
          data: 'base64encodeddata',
          mimeType: 'text/plain',
        },
      ],
    });
    expect(result.response).toBe('This is a mocked chat response.');
  });
});
