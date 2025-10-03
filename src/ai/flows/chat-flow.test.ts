import { describe, it, expect } from 'vitest';
import { chatFlow } from './chat-flow';

import { vi } from 'vitest';

// Mock the chat-actions functions
vi.mock('@/lib/chat-actions', () => ({
  createChatSession: vi.fn().mockResolvedValue({ data: { id: 'new-mock-session' }, error: null }),
  addMessageToChat: vi.fn().mockResolvedValue({ data: { id: 'new-mock-message' }, error: null }),
}));

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      candidates: [{
        content: {
          parts: [{ text: "Mocked AI response" }]
        }
      }]
    }),
  })
);

describe('chatFlow', () => {
  it('should process a message for a guest user', async () => {
    const input = {
      userId: 'test-user',
      isGuest: true,
      message: 'Hello, world!',
    };

    const result = await chatFlow(input);

    expect(result.response).toBe("Mocked AI response");
    expect(result.sessionId).toBeUndefined();
  });

  it('should create a new session for a logged-in user', async () => {
    const input = {
      userId: 'test-user-li',
      isGuest: false,
      message: 'Hello, again!',
    };

    const result = await chatFlow(input);

    expect(result.sessionId).toBe('new-mock-session');
  });
});