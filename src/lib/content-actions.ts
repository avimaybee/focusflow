
'use server';

import { db } from '@/lib/firebase-admin';
import { slugify } from '@/lib/utils';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Makes a user's summary public.
 *
 * @param userId The ID of the user.
 * @param summaryId The ID of the summary to make public.
 * @returns The public slug of the summary.
 */
export async function makeSummaryPublic(userId: string, summaryId: string): Promise<string> {
  const userSummaryRef = db.collection('users').doc(userId).collection('summaries').doc(summaryId);
  const publicSummariesCollection = db.collection('publicSummaries');

  const summaryDoc = await userSummaryRef.get();
  if (!summaryDoc.exists) {
    throw new Error('Summary not found.');
  }

  const summaryData = summaryDoc.data()!;
  const title = summaryData.title || 'Untitled Summary';
  let baseSlug = slugify(title);
  let publicSlug = baseSlug;
  let attempts = 0;

  // Find a unique slug
  while ((await publicSummariesCollection.where('publicSlug', '==', publicSlug).get()).size > 0) {
    attempts++;
    publicSlug = `${baseSlug}-${attempts}`;
  }

  const publicSummaryData = {
    ...summaryData,
    publicSlug,
    originalUserId: userId,
    publishedAt: FieldValue.serverTimestamp(),
  };

  await publicSummariesCollection.doc(publicSlug).set(publicSummaryData);
  await userSummaryRef.update({
    isPublic: true,
    publicSlug: publicSlug,
  });

  return publicSlug;
}

export async function makeFlashcardsPublic(userId: string, setId: string): Promise<string> {
    const userSetRef = db.collection('users').doc(userId).collection('flashcardSets').doc(setId);
    const publicCollection = db.collection('publicFlashcardSets');
  
    const doc = await userSetRef.get();
    if (!doc.exists) throw new Error('Flashcard set not found.');
  
    const data = doc.data()!;
    const title = data.title || 'Untitled Flashcards';
    let baseSlug = slugify(title);
    let publicSlug = baseSlug;
    let attempts = 0;
  
    while ((await publicCollection.where('publicSlug', '==', publicSlug).get()).size > 0) {
      attempts++;
      publicSlug = `${baseSlug}-${attempts}`;
    }
  
    const publicData = {
      ...data,
      publicSlug,
      originalUserId: userId,
      publishedAt: FieldValue.serverTimestamp(),
    };
  
    await publicCollection.doc(publicSlug).set(publicData);
    await userSetRef.update({ isPublic: true, publicSlug });
  
    return publicSlug;
}

export async function makeQuizPublic(userId: string, quizId: string): Promise<string> {
    const userQuizRef = db.collection('users').doc(userId).collection('quizzes').doc(quizId);
    const publicCollection = db.collection('publicQuizzes');

    const doc = await userQuizRef.get();
    if (!doc.exists) throw new Error('Quiz not found.');

    const data = doc.data()!;
    const title = data.title || 'Untitled Quiz';
    let baseSlug = slugify(title);
    let publicSlug = baseSlug;
    let attempts = 0;

    while ((await publicCollection.where('publicSlug', '==', publicSlug).get()).size > 0) {
        attempts++;
        publicSlug = `${baseSlug}-${attempts}`;
    }

    const publicData = {
        ...data,
        publicSlug,
        originalUserId: userId,
        publishedAt: FieldValue.serverTimestamp(),
    };

    await publicCollection.doc(publicSlug).set(publicData);
    await userQuizRef.update({ isPublic: true, publicSlug });

    return publicSlug;
}

export async function makeStudyPlanPublic(userId: string, planId: string): Promise<string> {
    const userPlanRef = db.collection('users').doc(userId).collection('studyPlans').doc(planId);
    const publicCollection = db.collection('publicStudyPlans');

    const doc = await userPlanRef.get();
    if (!doc.exists) throw new Error('Study plan not found.');

    const data = doc.data()!;
    const title = data.title || 'Untitled Study Plan';
    let baseSlug = slugify(title);
    let publicSlug = baseSlug;
    let attempts = 0;

    while ((await publicCollection.where('publicSlug', '==', publicSlug).get()).size > 0) {
        attempts++;
        publicSlug = `${baseSlug}-${attempts}`;
    }

    const publicData = {
        ...data,
        publicSlug,
        originalUserId: userId,
        publishedAt: FieldValue.serverTimestamp(),
    };

    await publicCollection.doc(publicSlug).set(publicData);
    await userPlanRef.update({ isPublic: true, publicSlug });

    return publicSlug;
}

export async function publishAsBlog(userId: string, summaryId: string, seoData: { title: string; excerpt: string; slug: string; tags: string[] }): Promise<string> {
    const userSummaryRef = db.collection('users').doc(userId).collection('summaries').doc(summaryId);
    const publicBlogCollection = db.collection('publicBlogPosts');

    const summaryDoc = await userSummaryRef.get();
    if (!summaryDoc.exists) {
        throw new Error('Summary not found.');
    }

    const summaryData = summaryDoc.data()!;
    const user = (await db.collection('users').doc(userId).get()).data();

    const publicSlug = seoData.slug;
    const publicBlogData = {
        title: seoData.title,
        excerpt: seoData.excerpt,
        publicSlug: publicSlug,
        tags: seoData.tags,
        content: summaryData.summary,
        author: user?.displayName || 'Anonymous',
        originalUserId: userId,
        originalSummaryId: summaryId,
        publishedAt: FieldValue.serverTimestamp(),
    };

    await publicBlogCollection.doc(publicSlug).set(publicBlogData);
    await userSummaryRef.update({
        isPublishedAsBlog: true,
        blogSlug: publicSlug,
    });

    return publicSlug;
}

/**
 * Saves a chat message to the user's content.
 * @param userId The ID of the user.
 * @param messageContent The raw text content of the message.
 */
export async function saveChatMessage(userId: string, messageContent: string): Promise<void> {
    const savedMessagesCollection = db.collection('users').doc(userId).collection('savedMessages');
    
    await savedMessagesCollection.add({
        content: messageContent,
        createdAt: FieldValue.serverTimestamp(),
    });
}

export async function deleteContent(userId: string, contentId: string, type: string): Promise<void> {
    const collectionName = type === 'flashcardSet' ? 'flashcardSets' : `${type}s`;
    const contentRef = db.collection('users').doc(userId).collection(collectionName).doc(contentId);
    
    // Optional: Also delete the public version if it exists
    const doc = await contentRef.get();
    if (doc.exists && doc.data()?.isPublic) {
        const publicSlug = doc.data()?.publicSlug;
        if (publicSlug) {
            const publicCollectionName = `public${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}`;
            await db.collection(publicCollectionName).doc(publicSlug).delete();
        }
    }

    await contentRef.delete();
}

export async function deleteChat(userId: string, chatId: string): Promise<void> {
    const chatRef = db.collection('users').doc(userId).collection('chats').doc(chatId);
    await chatRef.delete();
}
