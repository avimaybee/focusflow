import type { ChatMessage } from './flows/chat-types';

/**
 * Selects the appropriate Gemini model based on prompt complexity, chat history, and user status.
 * @param currentPrompt The user's current text prompt.
 * @param chatHistory The history of the conversation.
 * @param isPremium Whether the user has a premium subscription.
 * @returns The name of the selected Gemini model.
 */
export function selectModel(
  currentPrompt: string,
  chatHistory: ChatMessage[],
  isPremium: boolean
): string {
  const lowerCasePrompt = currentPrompt.toLowerCase();
  const fullConversation = [...chatHistory.map(m => m.text), currentPrompt].join('\n').toLowerCase();

  // Keywords that strongly suggest a highly complex or analytical task.
  const complexKeywords = [
    'analyze in-depth', 'comprehensive analysis', 'multi-step plan', 
    'construct a detailed argument', 'critique the methodology', 'develop a framework'
  ];

  // Keywords for moderately complex tasks.
  const moderateKeywords = [
    'summarize', 'explain', 'compare', 'contrast', 'create a plan', 'brainstorm'
  ];
  
  // 1. Highest priority: Premium users with complex queries get the best model.
  if (isPremium && complexKeywords.some(kw => fullConversation.includes(kw))) {
    return 'googleai/gemini-2.5-pro';
  }

  // 2. For deeply complex tasks for any user (premium or free).
  if (complexKeywords.some(kw => fullConversation.includes(kw)) || currentPrompt.length > 2500) {
    return 'googleai/gemini-2.5-flash';
  }

  // 3. For moderate workloads, like summarizing a long text or initial complex questions.
  if (moderateKeywords.some(kw => lowerCasePrompt.includes(kw)) || currentPrompt.length > 800) {
    return 'googleai/gemini-2.0-flash';
  }

  // 4. Default to the fastest, most cost-effective model for all other light, conversational tasks.
  return 'googleai/gemini-2.5-flash-lite-preview-06-17';
}
