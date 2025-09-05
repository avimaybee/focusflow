import { describe, it, expect } from 'vitest';
import { chatFlow } from './chat-flow';

describe('chatFlow', () => {
  it('should return an under construction message', async () => {
    const input = {
      userId: 'test-user',
      message: 'Hello, world!',
    };

    const result = await chatFlow(input);

    expect(result.response).toBe("I'm sorry, the chat functionality is currently under construction while we upgrade our systems to Supabase. Please check back later.");
    expect(result.sessionId).toBe('new-session');
  });

  it('should use the provided sessionId', async () => {
    const input = {
      userId: 'test-user',
      message: 'Hello, again!',
      sessionId: 'existing-session-id',
    };

    const result = await chatFlow(input);

    expect(result.sessionId).toBe('existing-session-id');
  });
});