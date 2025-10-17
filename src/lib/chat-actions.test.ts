// Test to verify null safety fixes for chat-actions
// This test ensures that the getChatHistory and getChatMessages functions
// handle null/undefined data gracefully without throwing "Cannot read properties of undefined" errors

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock supabase
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
};

// Mock the supabase module
vi.mock('./supabase', () => ({
  supabase: mockSupabase
}));

// Mock marked
vi.mock('marked', () => ({
  marked: {
    parse: vi.fn((text: string) => Promise.resolve(text))
  }
}));

describe('chat-actions null safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getChatHistory', () => {
    it('should return empty array when data is null', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({ data: null, error: null });
      
      // Import after mocks are set up
      const { getChatHistory } = await import('./chat-actions');
      
      // Act
      const result = await getChatHistory('test-user-id');
      
      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when data is undefined', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({ data: undefined, error: null });
      
      // Import after mocks are set up
      const { getChatHistory } = await import('./chat-actions');
      
      // Act
      const result = await getChatHistory('test-user-id');
      
      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when there is an error', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });
      
      // Import after mocks are set up
      const { getChatHistory } = await import('./chat-actions');
      
      // Act
      const result = await getChatHistory('test-user-id');
      
      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should process data correctly when data is valid', async () => {
      // Arrange
      const mockData = [
        { id: '1', title: 'Chat 1', created_at: '2024-01-01T00:00:00Z' },
        { id: '2', title: 'Chat 2', created_at: '2024-01-02T00:00:00Z' }
      ];
      mockSupabase.order.mockResolvedValue({ data: mockData, error: null });
      
      // Import after mocks are set up
      const { getChatHistory } = await import('./chat-actions');
      
      // Act
      const result = await getChatHistory('test-user-id');
      
      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].title).toBe('Chat 1');
    });
  });

  describe('getChatMessages', () => {
    it('should return empty array when data is null', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({ data: null, error: null });
      
      // Import after mocks are set up
      const { getChatMessages } = await import('./chat-actions');
      
      // Act
      const result = await getChatMessages('test-session-id');
      
      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when data is undefined', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({ data: undefined, error: null });
      
      // Import after mocks are set up
      const { getChatMessages } = await import('./chat-actions');
      
      // Act
      const result = await getChatMessages('test-session-id');
      
      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when there is an error', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });
      
      // Import after mocks are set up
      const { getChatMessages } = await import('./chat-actions');
      
      // Act
      const result = await getChatMessages('test-session-id');
      
      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should process data correctly when data is valid', async () => {
      // Arrange
      const mockData = [
        { id: '1', role: 'user', content: 'Hello', created_at: '2024-01-01T00:00:00Z' },
        { id: '2', role: 'model', content: 'Hi there', created_at: '2024-01-01T00:00:01Z' }
      ];
      mockSupabase.order.mockResolvedValue({ data: mockData, error: null });
      
      // Import after mocks are set up
      const { getChatMessages } = await import('./chat-actions');
      
      // Act
      const result = await getChatMessages('test-session-id');
      
      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].role).toBe('user');
      expect(result[0].rawText).toBe('Hello');
    });
  });
});
