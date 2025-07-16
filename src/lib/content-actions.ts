'use server';

import { db } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Saves a specific chat message to a user's "Saved Messages" collection.
 * @param userId The ID of the user.
 * @param messageContent The text content of the message to save.
 */
export async function saveChatMessage(userId: string, messageContent: string) {
  if (!userId || !messageContent) {
    throw new Error('User ID and message content are required.');
  }
  const savedMessagesRef = db.collection('users').doc(userId).collection('savedMessages');
  await savedMessagesRef.add({
    content: messageContent,
    savedAt: FieldValue.serverTimestamp(),
  });
  return { success: true };
}

/**
 * Deletes a chat session from a user's account.
 * @param userId The ID of the user.
 * @param chatId The ID of the chat to delete.
 */
export async function deleteChat(userId: string, chatId: string) {
  if (!userId || !chatId) {
    throw new Error('User ID and Chat ID are required.');
  }
  const chatRef = db.collection('users').doc(userId).collection('chats').doc(chatId);
  await chatRef.delete();
  return { success: true };
}