import { vi, describe, it, expect, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { chatFlow } from '@/ai/flows/chat-flow';
import { getAuth } from 'firebase-admin/auth';

// Mock the chatFlow
vi.mock('@/ai/flows/chat-flow', () => ({
  chatFlow: vi.fn(),
}));

// Mock firebase-admin
vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(),
}));
vi.mock('@/lib/firebase-admin', () => ({
  app: {}, // Mock the app object
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

  const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
    return new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      headers: new Headers(headers),
      body: JSON.stringify(body),
    });
  };

  it('should handle a valid request from an authenticated user', async () => {
    // Mock authenticated user
    (getAuth as vi.Mock).mockReturnValue({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: 'test-user-id', firebase: { sign_in_provider: 'password' } }),
    });

    const request = createMockRequest(
      { message: 'Hello AI' },
      { Authorization: 'Bearer valid-token' }
    );

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(chatFlow).toHaveBeenCalledWith({
      userId: 'test-user-id',
      isGuest: false,
      message: 'Hello AI',
      sessionId: undefined,
      personaId: 'neutral',
      context: undefined,
    });
    expect(responseBody.response).toBe('Mocked AI response');
  });

  it('should handle a valid request from a guest user', async () => {
    const request = createMockRequest({ message: 'Hello Guest' }); // No Auth header

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(chatFlow).toHaveBeenCalledWith({
      userId: 'guest-user',
      isGuest: true,
      message: 'Hello Guest',
      sessionId: undefined,
      personaId: 'neutral',
      context: undefined,
    });
    expect(getAuth).not.toHaveBeenCalled();
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

  it('should treat a user with an invalid token as a guest', async () => {
    // Mock auth verification failure
    (getAuth as vi.Mock).mockReturnValue({
      verifyIdToken: vi.fn().mockRejectedValue(new Error('Invalid token')),
    });

    const request = createMockRequest(
      { message: 'Hello with bad token' },
      { Authorization: 'Bearer invalid-token' }
    );

    const response = await POST(request);
    const responseBody = await response.json();
    
    expect(response.status).toBe(200);
    expect(chatFlow).toHaveBeenCalledWith({
      userId: 'guest-user',
      isGuest: true,
      message: 'Hello with bad token',
      sessionId: undefined,
      personaId: 'neutral',
      context: undefined,
    });
    expect(responseBody.response).toBe('Mocked AI response');
  });
});
