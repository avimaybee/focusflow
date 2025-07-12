import { Message } from 'genkit';
import { ai } from '@/ai/genkit';

// Using a simple character count for token estimation.
// This is a rough approximation: 1 token ~ 4 characters.
function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

async function summarizeHistory(messages: Message[]): Promise<string> {
  const historyText = messages
    .map(m => `${m.role}: ${m.parts[0].text}`)
    .join('\n');

  const summarizationPrompt = `You are a history summarizer. Briefly summarize the key points of the following conversation excerpt. Focus on user requests, important facts, and decisions made. The summary will be used as context for an ongoing chat, so it must be concise and informative.

CONVERSATION EXCERPT:
${historyText}

CONCISE SUMMARY:`;

  try {
    const result = await ai.generate({
      model: 'googleai/gemini-1.5-flash', // Fast and efficient model for summarization
      prompt: summarizationPrompt,
      config: { temperature: 0.1 },
    });
    return result.text();
  } catch (error) {
    console.error('Error summarizing chat history:', error);
    // Fallback to a simple truncation message if summarization fails
    return '...previous context summarized...';
  }
}

export async function optimizeChatHistory(
  history: Message[],
  maxTokens: number = 8000
): Promise<Message[]> {
  // If there's no history to optimize, return an empty array.
  if (!history || history.length === 0) {
    return [];
  }

  const messagesToKeep = {
    first: 2, // Keep the first 2 messages for initial context
    last: 8  // Keep the last 8 messages for recent context (but we don't include the absolute last message)
  };

  // Calculate total tokens for the whole history
  const totalTokens = history.reduce(
    (acc, msg) => acc + estimateTokens(msg.parts[0]?.text || ''),
    0
  );

  // If we're within the token limit, no optimization is needed
  if (totalTokens <= maxTokens) {
    return history;
  }

  // If there aren't enough messages to perform a summary, return as is
  if (history.length <= messagesToKeep.first + messagesToKeep.last) {
    return history;
  }

  const firstMessages = history.slice(0, messagesToKeep.first);
  const lastMessages = history.slice(-messagesToKeep.last);
  const middleMessages = history.slice(
    messagesToKeep.first,
    -messagesToKeep.last
  );

  const summaryText = await summarizeHistory(middleMessages);

  const summaryMessage: Message = {
    role: 'system', // Use 'system' role for context that is not from user or model
    parts: [{ text: `[A summary of the conversation so far: ${summaryText}]` }]
  };

  const optimizedHistory = [...firstMessages, summaryMessage, ...lastMessages];

  return optimizedHistory;
}
