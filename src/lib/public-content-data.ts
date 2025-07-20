import { db } from '@/lib/firebase-admin';

// Functions to fetch all public content for sitemap generation

export async function getPublicSummaries() {
  const snapshot = await db.collection('publicSummaries').get();
  return snapshot.docs.map(doc => doc.data());
}

export async function getPublicFlashcardSets() {
  const snapshot = await db.collection('publicFlashcardSets').get();
  return snapshot.docs.map(doc => doc.data());
}

export async function getPublicQuizzes() {
  const snapshot = await db.collection('publicQuizzes').get();
  return snapshot.docs.map(doc => doc.data());
}

export async function getPublicStudyPlans() {
  const snapshot = await db.collection('publicStudyPlans').get();
  return snapshot.docs.map(doc => doc.data());
}

export async function getAllUsernames() {
    const snapshot = await db.collection('usernames').get();
    return snapshot.docs.map(doc => doc.id);
}