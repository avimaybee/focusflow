import type { Message } from 'genkit';

export async function optimizeChatHistory(history: Message[]): Promise<Message[]> {
  // Add validation at the start
  const validatedHistory = history.filter(msg => {
    if (!msg || !msg.content || !Array.isArray(msg.content) || msg.content.length === 0) {
      console.warn('Filtering out invalid message in optimizer:', msg);
      return false;
    }
    // Check if every part of the content is valid
    return msg.content.every(part => part.text || part.media);
  });
  
  // For now, our optimization is simple: just return the validated history.
  // In the future, you could add logic here to summarize older parts of the conversation
  // if the token count gets too high.
  const optimized = validatedHistory;
  
  return optimized;
}
