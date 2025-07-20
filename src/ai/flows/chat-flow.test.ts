import { vi, describe, it, expect, beforeEach } from 'vitest';
import { chatFlow } from './chat-flow';
import { ai } from '@/ai/genkit';

// Mock Firebase Admin
vi.mock('@/lib/firebase-admin', () => ({
  db: {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        prompt: 'You are a helpful AI study assistant.',
        name: 'AI Assistant',
        avatarUrl: '',
      }),
    }),
  },
  serverTimestamp: vi.fn(),
}));

// Mock Genkit AI
vi.mock('@/ai/genkit', () => {
    const mockAi = {
        createSession: vi.fn(),
        loadSession: vi.fn(),
        defineFlow: vi.fn((_, handler) => handler),
        defineTool: vi.fn(tool => tool),
    };

    const mockChat = {
        send: vi.fn().mockResolvedValue({
            text: 'Hello! This is a test response.',
            history: [],
        }),
    };

    const mockSession = {
        id: 'test-session-id',
        chat: () => mockChat,
    };
    
    const mockLoadedSession = {
        id: 'existing-session-id',
        chat: () => ({
             send: vi.fn().mockResolvedValue({
                text: 'Welcome back!',
                history: [],
            }),
        })
    };

    mockAi.createSession.mockResolvedValue(mockSession);
    mockAi.loadSession.mockResolvedValue(mockLoadedSession);

    return { ai: mockAi };
});


// Mock Google AI
vi.mock('@genkit-ai/googleai', () => ({
  googleAI: {
    model: vi.fn(() => ({
      chat: vi.fn(() => ({
        send: vi.fn().mockResolvedValue({
          text: 'Hello! This is a test response.',
          history: [],
        }),
      })),
    })),
  },
}));

describe('chatFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process a new chat message and return a response', async () => {
    const input = {
      userId: 'test-user',
      isGuest: false,
      message: 'Hello, world!',
    };

    const result = await chatFlow(input);

    expect(ai.createSession).toHaveBeenCalled();
    expect(result.sessionId).toBe('test-session-id');
    expect(result.response).toBe('Hello! This is a test response.');
  });

  it('should load an existing session if sessionId is provided', async () => {
    const input = {
      userId: 'test-user',
      isGuest: false,
      message: 'Hello, again!',
      sessionId: 'existing-session-id',
    };
    
    (ai.loadSession as vi.Mock).mockResolvedValueOnce({
        id: 'existing-session-id',
        chat: () => ({
            send: vi.fn().mockResolvedValue({
                text: 'Welcome back!',
                history: [],
            }),
        }),
    });

    const result = await chatFlow(input);

    expect(ai.loadSession).toHaveBeenCalledWith('existing-session-id', expect.any(Object));
    expect(ai.createSession).not.toHaveBeenCalled();
    expect(result.sessionId).toBe('existing-session-id');
    expect(result.response).toBe('Welcome back!');
  });

  it('should use the specified persona prompt', async () => {
    const input = {
      userId: 'test-user',
      isGuest: false,
      message: 'Tell me a joke.',
      personaId: 'comedian',
    };

    // Mock the persona fetch
    const { db } = await import('@/lib/firebase-admin');
    (db.get as vi.Mock).mockResolvedValueOnce({
      exists: true,
      data: () => ({
        prompt: 'You are a comedian.',
        name: 'Comedian',
        avatarUrl: '',
      }),
    });
    
    const mockSend = vi.fn().mockResolvedValue({
        text: 'Why did the chicken cross the road?',
        history: [],
    });
    
    (ai.createSession as vi.Mock).mockResolvedValueOnce({
        id: 'test-session-id',
        chat: (config) => {
            expect(config.system).toContain('You are a comedian.');
            return {
                send: mockSend,
            };
        },
    });

    await chatFlow(input);

    expect(db.doc).toHaveBeenCalledWith('comedian');
  });

  it('should use the sassy persona prompt when personaId is "sassy"', async () => {
    const input = {
      userId: 'test-user',
      isGuest: false,
      message: 'Ugh, another question.',
      personaId: 'sassy',
    };

    const sassyPrompt = 'Your name is Cleo. You are a sassy, witty, and irreverent teaching assistant.';
    
    // Mock the persona fetch for 'sassy'
    const { db } = await import('@/lib/firebase-admin');
    (db.get as vi.Mock).mockResolvedValueOnce({
      exists: true,
      data: () => ({
        prompt: sassyPrompt,
        name: 'Sassy Assistant',
        avatarUrl: '',
      }),
    });
    
    const mockSend = vi.fn().mockResolvedValue({
        text: 'Oh, joy. Another chance to enlighten the masses.',
        history: [],
    });
    
    // We need to inspect the `system` prompt passed to the chat
    let capturedSystemPrompt = '';
    (ai.createSession as vi.Mock).mockResolvedValueOnce({
        id: 'test-session-id',
        chat: (config) => {
            capturedSystemPrompt = config.system;
            return {
                send: mockSend,
            };
        },
    });

    await chatFlow(input);

    expect(db.doc).toHaveBeenCalledWith('sassy');
    expect(capturedSystemPrompt).toContain(sassyPrompt);
  });
});
