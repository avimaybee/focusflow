
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function updateUserPersona(userId: string, persona: string) {
  if (!userId) return;
  const userRef = doc(db, 'users', userId);
  try {
    // Ensure the document exists before updating, though updateDoc would fail anyway
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, {
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
    const userRef = doc(db, 'users', userId);
    try {
        await updateDoc(userRef, {
            favoritePrompts: favoriteIds,
        });
    } catch (error) {
        console.error("Error updating user favorite prompts: ", error);
    }
}
