'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

const PublicProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required.'),
  bio: z.string().max(160, 'Bio must be 160 characters or less.').optional(),
  school: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

/**
 * Checks if a username is available.
 * @param username The username to check.
 * @returns True if the username is available, false otherwise.
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const usernameRef = db.collection('usernames').doc(username);
  const doc = await usernameRef.get();
  return !doc.exists;
}

/**
 * Updates a user's public profile and username.
 * @param userId The ID of the user.
 * @param username The new username.
 * @param profileData The new profile data.
 */
export async function updateUserProfile(userId: string, username: string, profileData: z.infer<typeof PublicProfileSchema>) {
  if (!userId) throw new Error('User not found.');

  const validatedProfile = PublicProfileSchema.parse(profileData);

  const userRef = db.collection('users').doc(userId);
  const usernameRef = db.collection('usernames').doc(username);

  const batch = db.batch();

  // Update the publicProfile map in the user's document
  batch.update(userRef, { 
    username: username,
    publicProfile: validatedProfile 
  });

  // Create the username lookup document
  batch.set(usernameRef, { userId });

  await batch.commit();
}

/**
 * Fetches a user's public profile and content by their username.
 * @param username The username of the user.
 * @returns The user's public profile and content, or null if not found.
 */
export async function getPublicProfile(username: string) {
  const usernameRef = db.collection('usernames').doc(username);
  const usernameDoc = await usernameRef.get();

  if (!usernameDoc.exists) {
    return null;
  }

  const userId = usernameDoc.data()?.userId;
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return null;
  }

  const user = userDoc.data();
  const publicProfile = user?.publicProfile;

  // Fetch public content
  const contentTypes = ['summaries', 'quizzes', 'flashcardSets', 'studyPlans'];
  const contentPromises = contentTypes.map(async (type) => {
    const contentRef = db.collection('users').doc(userId).collection(type);
    const q = contentRef.where('isPublic', '==', true);
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, type: type.slice(0, -1), ...doc.data() }));
  });

  const publicContent = (await Promise.all(contentPromises)).flat();

  return {
    profile: publicProfile,
    content: publicContent,
  };
}

const getCollectionName = (type: string) => {
    if (type === 'summary') return 'summaries';
    if (type === 'quiz') return 'quizzes';
    if (type === 'flashcardSet') return 'flashcardSets';
    if (type === 'studyPlan') return 'studyPlans';
    throw new Error(`Invalid content type: ${type}`);
};

/**
 * Increments the helpful count for a piece of content.
 * @param authorId The ID of the user who created the content.
 * @param contentId The ID of the content.
 * @param contentType The type of the content.
 */
export async function incrementHelpfulCount(authorId: string, contentId: string, contentType: string) {
    if (!authorId || !contentId || !contentType) throw new Error('Missing required fields.');
    const collectionName = getCollectionName(contentType);
    const contentRef = db.collection('users').doc(authorId).collection(collectionName).doc(contentId);
    await contentRef.update({ helpfulCount: FieldValue.increment(1) });
}

/**
 * Increments the view count for a piece of content.
 * @param authorId The ID of the user who created the content.
 * @param contentId The ID of the content.
 * @param contentType The type of the content.
 */
export async function incrementViews(authorId: string, contentId: string, contentType: string) {
    if (!authorId || !contentId || !contentType) return; // Fail silently
    try {
        const collectionName = getCollectionName(contentType);
        const contentRef = db.collection('users').doc(authorId).collection(collectionName).doc(contentId);
        await contentRef.update({ views: FieldValue.increment(1) });
    } catch (error) {
        console.error(`Failed to increment views for ${contentType} ${contentId}:`, error);
    }
}
