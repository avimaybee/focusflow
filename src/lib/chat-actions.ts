
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

import { auth } from '@/lib/firebase-admin'; // Using Admin SDK for server-side verification

// Helper function to verify user authentication on the server
async function getAuthenticatedUserId() {
  const user = auth.currentUser; // This will only work if the session is managed correctly
  if (!user) {
    throw new Error('User not authenticated.');
  }
  return user.uid;
}

/**
 * Creates a new chat session in Firestore.
 * @param initialMessage The first message to start the chat with.
 * @returns The ID of the newly created chat.
 */
export async function createChat(initialMessage: string) {
  const userId = await getAuthenticatedUserId();

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
 * @param chatId The ID of the chat to add the message to.
 * @param message The message object to add.
 */
export async function addMessageToChat(
  chatId: string,
  message: { role: 'user' | 'model'; text: string }
) {
  const userId = await getAuthenticatedUserId();
  if (!chatId) {
    throw new Error('Chat ID is required.');
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
 * @returns A promise that resolves to an array of chat objects.
 */
export async function getRecentChats(): Promise<Chat[]> {
  const userId = await getAuthenticatedUserId();
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
 * @param chatId The ID of the chat.
 * @returns A promise that resolves to an array of message objects.
 */
export async function getChatMessages(
  chatId: string
): Promise<ChatMessage[]> {
  const userId = await getAuthenticatedUserId();
  if (!chatId) return [];
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
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    // If the message text is a JSON string, parse it.
    // This is used to reconstruct interactive components like quizzes/flashcards.
    try {
      const parsedText = JSON.parse(data.text);
      return {
        id: doc.id,
        role: data.role,
        ...parsedText, // Spread the parsed content (e.g., text, quiz, flashcards)
        createdAt: data.createdAt,
      };
    } catch (e) {
      // It's not a JSON string, so treat it as plain text.
      return {
        id: doc.id,
        role: data.role,
        text: data.text,
        createdAt: data.createdAt,
      };
    }
  });
}
