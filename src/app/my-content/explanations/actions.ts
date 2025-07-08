'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import {
  explainConcept,
  ExplainConceptInput,
  ExplainConceptOutput,
} from '@/ai/flows/explain-concept';

export type { ExplainConceptInput, ExplainConceptOutput };

export interface SavedExplanation {
  id: string;
  highlightedText: string;
  explanation: string;
  example: string;
  createdAt: string;
}

export async function handleExplainConcept(
  input: ExplainConceptInput
): Promise<ExplainConceptOutput | null> {
  try {
    const result = await explainConcept(input);
    return result;
  } catch (error) {
    console.error('Error in explainConcept flow:', error);
    return null;
  }
}

export async function handleSaveExplanation(
  userId: string,
  data: Omit<SavedExplanation, 'id' | 'createdAt'>
): Promise<SavedExplanation | null> {
  try {
    const docRef = await addDoc(
      collection(db, 'users', userId, 'explanations'),
      {
        ...data,
        createdAt: serverTimestamp(),
      }
    );
    const createdAt = new Date().toISOString(); // Approximate for immediate feedback
    return { id: docRef.id, ...data, createdAt };
  } catch (error) {
    console.error('Error saving explanation:', error);
    return null;
  }
}

export async function getSavedExplanations(
  userId: string
): Promise<SavedExplanation[]> {
  const explanationsRef = collection(db, 'users', userId, 'explanations');
  const q = query(explanationsRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    const createdAt =
      (data.createdAt as Timestamp)?.toDate().toISOString() ||
      new Date().toISOString();
    return {
      id: doc.id,
      highlightedText: data.highlightedText,
      explanation: data.explanation,
      example: data.example,
      createdAt,
    };
  });
}

export async function handleDeleteExplanation(
  userId: string,
  explanationId: string
): Promise<{ success: boolean }> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'explanations', explanationId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting explanation:', error);
    return { success: false };
  }
}
