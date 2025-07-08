'use server';

import { createDiscussionPrompts, CreateDiscussionPromptsInput } from '@/ai/flows/create-discussion-prompts';

export async function handleGeneratePrompts(input: CreateDiscussionPromptsInput) {
  try {
    const result = await createDiscussionPrompts(input);
    return result;
  } catch (error) {
    console.error("Error generating discussion prompts:", error);
    return null;
  }
}
