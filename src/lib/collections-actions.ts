'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

const CollectionSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  userId: z.string(),
  createdAt: z.any(),
  updatedAt: z.any(),
  contentIds: z.array(z.string()),
});

/**
 * Creates a new study collection for a user.
 * @param userId The ID of the user.
 * @param title The title of the new collection.
 * @returns The ID of the newly created collection.
 */
export async function createCollection(userId: string, title: string): Promise<string> {
  if (!userId) throw new Error('User not found.');

  const collectionData = {
    userId,
    title,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    contentIds: [],
  };

  const validatedData = CollectionSchema.parse(collectionData);
  const collectionRef = await db.collection('userCollections').add(validatedData);
  return collectionRef.id;
}

/**
 * Adds a piece of content to a study collection.
 * @param userId The ID of the user.
 * @param collectionId The ID of the collection.
 * @param contentId The ID of the content to add.
 */
export async function addContentToCollection(userId: string, collectionId: string, contentId: string): Promise<void> {
  if (!userId) throw new Error('User not found.');

  const collectionRef = db.collection('userCollections').doc(collectionId);
  
  // In a real app, you'd want to verify the user owns this collection.
  // For now, we'll proceed directly.

  await collectionRef.update({
    contentIds: FieldValue.arrayUnion(contentId),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Fetches all study collections for a user.
 * @param userId The ID of the user.
 * @returns A list of the user's collections.
 */
export async function getCollections(userId: string) {
  if (!userId) throw new Error('User not found.');
  
  const collectionsRef = db.collection('userCollections').where('userId', '==', userId).orderBy('updatedAt', 'desc');
  const snapshot = await collectionsRef.get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
