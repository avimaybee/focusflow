'use server';

import { tutorChat, TutorChatInput, TutorChatOutput } from '@/ai/flows/tutor-chat';

export async function handleTutorChat(input: TutorChatInput): Promise<TutorChatOutput | null> {
  try {
    const result = await tutorChat(input);
    return result;
  } catch (error) {
    console.error('Error in tutorChat flow:', error);
    return null;
  }
}
