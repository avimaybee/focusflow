
'use server';

import { db } from '@/lib/firebase-admin'; // Use Firebase Admin SDK

export interface Persona {
  id: string;
  name: string;
  description: string;
  prompt: string;
  isDefault?: boolean;
}

export async function getPersonas(): Promise<Persona[]> {
  try {
    const personasSnapshot = await db.collection('personas').get();
    if (personasSnapshot.empty) {
      return [];
    }
    return personasSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Persona[];
  } catch (error) {
    console.error("Error fetching personas: ", error);
    return [];
  }
}

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
