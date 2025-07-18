
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface AiMemory {
  topics: string[];
  preferences: string[];
}

const initialMemory: AiMemory = {
  topics: [],
  preferences: [],
};

/**
 * Retrieves the user's AI memory from Firestore.
 * @param uid The user's ID.
 * @returns The AiMemory object, or an initial empty object if not found.
 */
export async function getMemory(uid: string): Promise<AiMemory> {
  if (!uid) return initialMemory;

  const memoryRef = doc(db, 'users', uid, 'memory', 'data');
  const docSnap = await getDoc(memoryRef);

  if (docSnap.exists()) {
    return (docSnap.data() as AiMemory) || initialMemory;
  } else {
    return initialMemory;
  }
}

/**
 * Saves the user's AI memory to Firestore.
 * @param uid The user's ID.
 * @param memory The AiMemory object to save.
 */
export async function saveMemory(uid: string, memory: AiMemory): Promise<void> {
  if (!uid) throw new Error('User ID is required.');
  
  const memoryRef = doc(db, 'users', uid, 'memory', 'data');
  await setDoc(memoryRef, {
    ...memory,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
