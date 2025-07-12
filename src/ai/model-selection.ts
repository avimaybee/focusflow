import type { ChatHistoryMessage } from './flows/chat-types';

/**
 * Selects the appropriate Gemini model based on the complexity of the user's request.
 * @param currentPrompt The user's current text prompt.
 * @param chatHistory The history of the conversation.
 * @param isPremium Whether the user has a premium subscription (not currently used but available).
 * @returns The name of the selected Gemini model.
 */
export function selectModel(
  currentPrompt: string,
  chatHistory: ChatHistoryMessage[],
  isPremium: boolean
): string {
  const lowerCasePrompt = currentPrompt.toLowerCase();

  // Keywords for deeply complex, multi-step reasoning or heavy analytical tasks.
  const complexKeywords = [
    'analyze in-depth',
    'comprehensive analysis',
    'multi-step reasoning',
    'heavy analytical',
    'construct a detailed argument',
    'critique the methodology',
    'develop a framework',
  ];

  // Keywords for moderate workloads like summarizing, classifying, or translating.
  const moderateKeywords = [
    'summarize',
    'summary',
    'classify',
    'classification',
    'translate',
    'translation',
    'explain',
    'compare',
    'contrast',
    'create a plan',
    'brainstorm',
  ];

  // 1. Highest priority: Premium users with complex queries get the best model.
  if (isPremium && complexKeywords.some((kw) => lowerCasePrompt.includes(kw))) {
    return 'googleai/gemini-2.5-pro';
  }

  // 2. Check for deeply complex tasks for non-premium users.
  if (complexKeywords.some((kw) => lowerCasePrompt.includes(kw))) {
    return 'googleai/gemini-2.5-flash';
  }

  // 3. Check for moderate workloads.
  if (moderateKeywords.some((kw) => lowerCasePrompt.includes(kw))) {
    return 'googleai/gemini-2.0-flash';
  }

  // 4. Default to the ultra-light, low-latency model for all other tasks.
  return 'googleai/gemini-2.5-flash-lite-preview-06-17';
}