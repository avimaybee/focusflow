
'use server';

import { db } from '@/lib/firebase-admin';
import { serverTimestamp } from 'firebase-admin/firestore';

/**
 * Saves a raw text chat message to a user's "savedMessages" collection.
 * @param userId The ID of the user.
 * @param content The text content of the message to save.
 */
export async function saveChatMessage(userId: string, content: string) {
  if (!userId || !content) {
    throw new Error('User ID and content are required to save a message.');
  }

  const savedMessagesRef = db.collection('users').doc(userId).collection('savedMessages');
  
  try {
    await savedMessagesRef.add({
      // We don't need a fancy title, the content is what matters.
      // The frontend can display "Saved Message" or similar.
      content: content,
      createdAt: serverTimestamp(),
    });
    console.log(`Saved message for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error(`Error saving chat message for user ${userId}:`, error);
    throw new Error('Could not save message to the database.');
  }
}
