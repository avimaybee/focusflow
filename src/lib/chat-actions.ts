
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export interface Chat {
  id: string;
  title: string;
  createdAt: Timestamp;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: Timestamp;
}

/**
 * Creates a new chat session in Firestore.
 * @param userId The ID of the user creating the chat.
 * @param initialMessage The first message to start the chat with.
 * @returns The ID of the newly created chat.
 */
export async function createChat(userId: string, initialMessage: string) {
  if (!userId) {
    throw new Error('User ID is required to create a chat.');
  }

  // Create the main chat document to get an ID
  const chatRef = await addDoc(collection(db, 'users', userId, 'chats'), {
    title: initialMessage.substring(0, 40), // Use the start of the first message as the title
    createdAt: serverTimestamp(),
  });

  // Add the first message to the messages subcollection
  await addDoc(collection(db, 'users', userId, 'chats', chatRef.id, 'messages'), {
      role: 'user',
      text: initialMessage,
      createdAt: serverTimestamp(),
  });

  revalidatePath('/chat');
  return chatRef.id;
}

/**
 * Adds a new message to an existing chat.
 * @param userId The ID of the user.
 * @param chatId The ID of the chat to add the message to.
 * @param message The message object to add.
 */
export async function addMessageToChat(
  userId: string,
  chatId: string,
  message: { role: 'user' | 'model'; text: string }
) {
  if (!userId || !chatId) {
    throw new Error('User ID and Chat ID are required.');
  }
  await addDoc(
    collection(db, 'users', userId, 'chats', chatId, 'messages'),
    {
      ...message,
      createdAt: serverTimestamp(),
    }
  );
  revalidatePath(`/chat/${chatId}`);
}

/**
 * Fetches the list of recent chats for a user.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of chat objects.
 */
export async function getRecentChats(userId: string): Promise<Chat[]> {
  if (!userId) return [];
  const chatsRef = collection(db, 'users', userId, 'chats');
  const q = query(chatsRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    title: doc.data().title,
    createdAt: doc.data().createdAt,
  }));
}

/**
 * Fetches all messages for a specific chat.
 * @param userId The ID of the user.
 * @param chatId The ID of the chat.
 * @returns A promise that resolves to an array of message objects.
 */
export async function getChatMessages(
  userId: string,
  chatId: string
): Promise<ChatMessage[]> {
  if (!userId || !chatId) return [];
  const messagesRef = collection(
    db,
    'users',
    userId,
    'chats',
    chatId,
    'messages'
  );
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    role: doc.data().role,
    text: doc.data().text,
    createdAt: doc.data().createdAt,
  }));
}
