'use server';

import { z } from 'zod';
import { summarizeNotes, SummarizeNotesInput, SummarizeNotesOutput } from '@/ai/flows/summarize-notes';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, getCountFromServer, getDoc, doc } from 'firebase/firestore';

const summarizerSchema = z.object({
  notes: z.string().min(50, 'Please enter at least 50 characters or upload a PDF to summarize.'),
});

const FREE_SUMMARY_LIMIT = 5;

export async function handleSummarize(input: { notes: string }) {
  const validation = summarizerSchema.safeParse(input);
  if (!validation.success) {
    // In a real app, you'd return this error to the form
    console.error(validation.error.flatten().fieldErrors);
    return null;
  }

  const isPdf = validation.data.notes.startsWith('data:application/pdf;base64,');
  const flowInput: SummarizeNotesInput = isPdf
    ? { pdfNotes: validation.data.notes }
    : { textNotes: validation.data.notes };
  
  try {
    const result = await summarizeNotes(flowInput);
    return result;
  } catch (error) {
    console.error('Error in summarizeNotes flow:', error);
    return null;
  }
}

export async function handleSaveSummary(
  userId: string,
  result: SummarizeNotesOutput,
  originalNotes: string
): Promise<{ success: boolean; error?: 'limit_reached' | 'unknown' }> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    const isPremium = userDoc.data()?.isPremium || false;

    if (!isPremium) {
      const summariesRef = collection(db, 'users', userId, 'summaries');
      const q = query(summariesRef);
      const snapshot = await getCountFromServer(q);
      if (snapshot.data().count >= FREE_SUMMARY_LIMIT) {
        return { success: false, error: 'limit_reached' };
      }
    }

    const title = result.summary.split(' ').slice(0, 8).join(' ') + '...';
    
    await addDoc(collection(db, 'users', userId, 'summaries'), {
      title,
      summary: result.summary,
      keywords: result.keywords.split(',').map(k => k.trim()),
      originalNotes,
      createdAt: serverTimestamp(),
      isPublic: false,
      publicSlug: null,
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error saving summary: ", error);
    return { success: false, error: 'unknown' };
  }
}
