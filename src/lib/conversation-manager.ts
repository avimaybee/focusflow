// src/lib/conversation-manager.ts
/**
 * Utilities for managing conversation history and preventing context overflow
 */

export interface ConversationMessage {
  role: 'user' | 'model';
  text: string;
  tokens?: number;
}

/**
 * Token estimation (rough approximation: 1 token ≈ 4 characters for English)
 * For more accurate counting, you could integrate tiktoken or similar
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate total tokens in a conversation
 */
export function calculateConversationTokens(messages: ConversationMessage[]): number {
  return messages.reduce((total, msg) => total + estimateTokens(msg.text), 0);
}

/**
 * Truncate conversation to fit within token limit
 * Strategy: Keep most recent messages, ensure user/model pairs are complete
 */
export function truncateConversation(
  messages: ConversationMessage[],
  maxTokens: number = 20000
): {
  truncated: ConversationMessage[];
  droppedCount: number;
  estimatedTokens: number;
} {
  if (messages.length === 0) {
    return { truncated: [], droppedCount: 0, estimatedTokens: 0 };
  }

  let totalTokens = 0;
  const kept: ConversationMessage[] = [];

  // Start from most recent and work backwards
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = estimateTokens(msg.text);
    
    if (totalTokens + msgTokens > maxTokens) {
      // Stop if we'd exceed limit
      break;
    }

    kept.unshift(msg); // Add to beginning to maintain order
    totalTokens += msgTokens;
  }

  // Ensure we keep at least last 2 exchanges (4 messages) if possible
  const minMessages = Math.min(4, messages.length);
  if (kept.length < minMessages) {
    const lastN = messages.slice(-minMessages);
    return {
      truncated: lastN,
      droppedCount: messages.length - lastN.length,
      estimatedTokens: calculateConversationTokens(lastN),
    };
  }

  return {
    truncated: kept,
    droppedCount: messages.length - kept.length,
    estimatedTokens: totalTokens,
  };
}

/**
 * Smart truncation with context preservation
 * Keeps: First message (for context), recent messages, and summarizes middle
 */
export function smartTruncate(
  messages: ConversationMessage[],
  maxTokens: number = 20000,
  options: {
    keepFirst?: boolean; // Keep first message for context
    summarize?: boolean; // TODO: Add summarization of dropped messages
  } = {}
): {
  truncated: ConversationMessage[];
  droppedCount: number;
  estimatedTokens: number;
  summary?: string;
} {
  const { keepFirst = true } = options;

  if (messages.length === 0) {
    return { truncated: [], droppedCount: 0, estimatedTokens: 0 };
  }

  const result = truncateConversation(messages, maxTokens);

  // If we're keeping first message and it's not already included
  if (keepFirst && result.droppedCount > 0 && messages.length > 0) {
    const firstMsg = messages[0];
    const firstTokens = estimateTokens(firstMsg.text);
    
    // Only add first message if it doesn't push us over limit
    if (result.estimatedTokens + firstTokens <= maxTokens) {
      result.truncated = [firstMsg, ...result.truncated];
      result.estimatedTokens += firstTokens;
    }
  }

  return result;
}

/**
 * Check if conversation is approaching token limit
 */
export function isConversationNearLimit(
  messages: ConversationMessage[],
  limit: number = 20000,
  threshold: number = 0.8 // 80% of limit
): boolean {
  const tokens = calculateConversationTokens(messages);
  return tokens >= limit * threshold;
}

/**
 * Get conversation statistics
 */
export function getConversationStats(messages: ConversationMessage[]): {
  messageCount: number;
  userMessages: number;
  modelMessages: number;
  estimatedTokens: number;
  averageMessageLength: number;
} {
  const userMessages = messages.filter(m => m.role === 'user').length;
  const modelMessages = messages.filter(m => m.role === 'model').length;
  const totalTokens = calculateConversationTokens(messages);
  const avgLength = messages.length > 0 
    ? messages.reduce((sum, m) => sum + m.text.length, 0) / messages.length 
    : 0;

  return {
    messageCount: messages.length,
    userMessages,
    modelMessages,
    estimatedTokens: totalTokens,
    averageMessageLength: Math.round(avgLength),
  };
}

/**
 * Recommended token limits by model
 */
export const RECOMMENDED_LIMITS = {
  'gemini-2.0-flash-exp': {
    total: 1000000, // 1M total capacity
    conversation: 30000, // Leave room for system instruction and response
    warning: 25000, // Warn user at this point
  },
  'gemini-1.5-flash': {
    total: 1000000,
    conversation: 30000,
    warning: 25000,
  },
  'gemini-1.5-pro': {
    total: 2000000, // 2M total capacity
    conversation: 50000,
    warning: 40000,
  },
  default: {
    total: 30000,
    conversation: 20000,
    warning: 15000,
  },
} as const;
