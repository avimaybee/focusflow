
'use server';

import { collection, getDocs, query } from 'firebase/firestore';
import { db } from './firebase';

interface DashboardStats {
  summariesCount: number;
  quizzesCount: number;
  flashcardSetsCount: number;
  studyPlansCount: number;
}

/**
 * Fetches and aggregates statistics for the user's dashboard.
 * @param userId The ID of the user.
 * @returns An object containing the user's dashboard stats.
 */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  if (!userId) {
    throw new Error('User ID is required to fetch dashboard stats.');
  }

  const collectionsToCount = [
    'summaries',
    'quizzes',
    'flashcardSets',
    'studyPlans',
  ];

  const counts = await Promise.all(
    collectionsToCount.map(async (collectionName) => {
      const collRef = collection(db, 'users', userId, collectionName);
      const snapshot = await getDocs(query(collRef));
      return snapshot.size;
    })
  );

  return {
    summariesCount: counts[0],
    quizzesCount: counts[1],
    flashcardSetsCount: counts[2],
    studyPlansCount: counts[3],
  };
}
