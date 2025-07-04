'use server';

import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, deleteDoc, doc, Timestamp } from 'firebase/firestore';

export interface SavedSummary {
    id: string;
    title: string;
    summary: string;
    keywords: string[];
    createdAt: string;
}

export async function getSummaries(userId: string): Promise<SavedSummary[]> {
    const summariesRef = collection(db, 'users', userId, 'summaries');
    const q = query(summariesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt as Timestamp;
        return {
            id: doc.id,
            title: data.title || 'Untitled Summary',
            summary: data.summary,
            keywords: data.keywords || [],
            createdAt: createdAt.toDate().toISOString(),
        }
    });
}

export async function handleDeleteSummary(userId: string, summaryId: string): Promise<{success: boolean}> {
    try {
        const summaryDocRef = doc(db, 'users', userId, 'summaries', summaryId);
        await deleteDoc(summaryDocRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting summary: ", error);
        return { success: false };
    }
}
