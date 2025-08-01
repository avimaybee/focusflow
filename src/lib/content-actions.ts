'use server';

import { db } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { slugify } from './utils';

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
    createdAt: FieldValue.serverTimestamp(), // Using createdAt for consistency
    updatedAt: FieldValue.serverTimestamp(),
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
    throw new Error('User ID and chat ID are required.');
  }
  await db.collection('users').doc(userId).collection('chats').doc(chatId).delete();
  return { success: true };
}

/**
 * Updates the content of a saved message or summary
 */
export async function updateContent(userId: string, contentId: string, type: 'savedMessages' | 'summaries', updates: { title?: string; content?: string }) {
  if (!userId || !contentId) {
    throw new Error('User ID and content ID are required.');
  }
  
  const contentRef = db.collection('users').doc(userId).collection(type).doc(contentId);
  await contentRef.update({
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  return { success: true };
}

/**
 * Publishes content as a blog post
 */
export async function publishAsBlog(userId: string, contentId: string, type: 'savedMessages' | 'summaries', blogData: {
  title: string;
  content: string;
  description: string;
  tags?: string[];
}) {
  if (!userId || !contentId) {
    throw new Error('User ID and content ID are required.');
  }

  const slug = slugify(blogData.title);
  const blogRef = db.collection('blogs').doc(slug);
  
  await blogRef.set({
    ...blogData,
    authorId: userId,
    originalContentId: contentId,
    originalContentType: type,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, slug };
}
  if (!userId || !chatId) {
    throw new Error('User ID and Chat ID are required.');
  }
  const chatRef = db.collection('users').doc(userId).collection('chats').doc(chatId);
  await chatRef.delete();
  return { success: true };
}

const getCollectionName = (type: string) => {
    if (type === 'summary') return 'summaries';
    if (type === 'quiz') return 'quizzes';
    if (type === 'flashcardSet') return 'flashcardSets';
    if (type === 'studyPlan') return 'studyPlans';
    if (type === 'savedMessage') return 'savedMessages';
    throw new Error(`Invalid content type: ${type}`);
};

export async function deleteContent(userId: string, itemId: string, type: string) {
    if (!userId || !itemId || !type) {
        throw new Error('User ID, Item ID, and Type are required.');
    }
    const collectionName = getCollectionName(type);
    const itemRef = db.collection('users').doc(userId).collection(collectionName).doc(itemId);
    await itemRef.delete();
    return { success: true };
}

export async function makeSummaryPublic(userId: string, summaryId: string) {
    const docRef = db.collection('users').doc(userId).collection('summaries').doc(summaryId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) throw new Error('Summary not found.');
    
    const data = docSnap.data();
    const slug = generateSlug();

    await db.collection('publicSummaries').doc(slug).set({
        ...data,
        authorId: userId,
        id: summaryId,
        isPublic: true,
        publicSlug: slug,
        publishedAt: FieldValue.serverTimestamp(),
    });

    await docRef.update({ isPublic: true, publicSlug: slug });
    return slug;
}

export async function makeFlashcardsPublic(userId: string, flashcardsId: string) {
    const docRef = db.collection('users').doc(userId).collection('flashcardSets').doc(flashcardsId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) throw new Error('Flashcard set not found.');

    const data = docSnap.data();
    const slug = generateSlug();

    await db.collection('publicFlashcardSets').doc(slug).set({
        ...data,
        authorId: userId,
        id: flashcardsId,
        isPublic: true,
        publicSlug: slug,
        publishedAt: FieldValue.serverTimestamp(),
    });

    await docRef.update({ isPublic: true, publicSlug: slug });
    return slug;
}

export async function makeQuizPublic(userId: string, quizId: string) {
    const docRef = db.collection('users').doc(userId).collection('quizzes').doc(quizId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) throw new Error('Quiz not found.');

    const data = docSnap.data();
    const slug = generateSlug();

    await db.collection('publicQuizzes').doc(slug).set({
        ...data,
        authorId: userId,
        id: quizId,
        isPublic: true,
        publicSlug: slug,
        publishedAt: FieldValue.serverTimestamp(),
    });

    await docRef.update({ isPublic: true, publicSlug: slug });
    return slug;
}

export async function makeStudyPlanPublic(userId: string, planId: string) {
    const docRef = db.collection('users').doc(userId).collection('studyPlans').doc(planId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) throw new Error('Study plan not found.');

    const data = docSnap.data();
    const slug = generateSlug();

    await db.collection('publicStudyPlans').doc(slug).set({
        ...data,
        authorId: userId,
        id: planId,
        isPublic: true,
        publicSlug: slug,
        publishedAt: FieldValue.serverTimestamp(),
    });

    await docRef.update({ isPublic: true, publicSlug: slug });
    return slug;
}

export async function toggleFavoriteStatus(userId: string, itemId: string, type: string, currentStatus: boolean) {
    if (!userId || !itemId || !type) {
        throw new Error('User ID, Item ID, and Type are required.');
    }
    const collectionName = getCollectionName(type);
    const itemRef = db.collection('users').doc(userId).collection(collectionName).doc(itemId);
    await itemRef.update({ isFavorited: !currentStatus });
    return { success: true, newState: !currentStatus };
}

export async function updateLastViewed(userId: string, itemId: string, type: string) {
    if (!userId || !itemId || !type) {
        // Silently fail if not enough info, as this is a background task
        console.warn('Missing info for updateLastViewed');
        return;
    }
    try {
        const collectionName = getCollectionName(type);
        const itemRef = db.collection('users').doc(userId).collection(collectionName).doc(itemId);
        await itemRef.update({ lastViewed: FieldValue.serverTimestamp() });
    } catch (error) {
        // Also fail silently on the client, but log it
        console.error(`Failed to update lastViewed for ${type} ${itemId}:`, error);
    }
}
