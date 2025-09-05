import { vi, describe, it, expect, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { chatFlow } from '@/ai/flows/chat-flow';

// Mock the chatFlow
vi.mock('@/ai/flows/chat-flow', () => ({
  chatFlow: vi.fn(),
}));

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for chatFlow
    (chatFlow as vi.Mock).mockResolvedValue({
      sessionId: 'mock-session-id',
      response: 'Mocked AI response',
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createMockRequest = (body: any) => {
    return new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  };

  it('should handle a valid request', async () => {
    const request = createMockRequest({ message: 'Hello AI' });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(chatFlow).toHaveBeenCalledWith({
      userId: 'guest-user',
      isGuest: true,
      message: 'Hello AI',
      sessionId: undefined,
      personaId: 'neutral',
      context: undefined,
    });
    expect(responseBody.response).toBe('Mocked AI response');
  });

  it('should return a 400 error if the message is missing', async () => {
    const request = createMockRequest({}); // Missing message

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error).toBe('Missing required field: message');
    expect(chatFlow).not.toHaveBeenCalled();
  });
});