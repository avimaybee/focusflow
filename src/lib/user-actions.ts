
'use server';

import { db } from '@/lib/firebase-admin'; // Use Firebase Admin SDK

export async function updateUserPersona(userId: string, persona: string) {
  if (!userId) return;
  const userRef = db.collection('users').doc(userId);
  try {
    // Ensure the document exists before updating, though updateDoc would fail anyway
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      await userRef.update({
        preferredPersona: persona,
      });
    }
  } catch (error) {
    console.error("Error updating user persona: ", error);
    // Optionally, re-throw or handle the error as needed
  }
}

export async function updateUserFavoritePrompts(userId: string, favoriteIds: string[]) {
    if (!userId) return;
    const userRef = db.collection('users').doc(userId);
    try {
        await userRef.update({
            favoritePrompts: favoriteIds,
        });
    } catch (error) {
        console.error("Error updating user favorite prompts: ", error);
    }
}
