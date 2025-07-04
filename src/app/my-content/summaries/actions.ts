'use server';

import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, deleteDoc, doc, Timestamp, updateDoc, getDoc, addDoc, setDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export interface SavedSummary {
    id: string;
    title: string;
    summary: string;
    keywords: string[];
    createdAt: string;
    isPublic: boolean;
    publicSlug: string | null;
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
            isPublic: data.isPublic || false,
            publicSlug: data.publicSlug || null,
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

export async function makeSummaryPublic(userId: string, summaryId: string): Promise<{ success: boolean; slug?: string; error?: string }> {
    const privateSummaryRef = doc(db, 'users', userId, 'summaries', summaryId);
    
    try {
        const privateSummarySnap = await getDoc(privateSummaryRef);
        if (!privateSummarySnap.exists()) {
            return { success: false, error: "Summary not found." };
        }

        const summaryData = privateSummarySnap.data();
        if (summaryData.isPublic && summaryData.publicSlug) {
            return { success: true, slug: summaryData.publicSlug };
        }

        // Generate a unique, SEO-friendly slug
        const title = summaryData.title || 'summary';
        const baseSlug = title.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 50);
        
        let uniqueSlug = '';
        let isUnique = false;
        let attempt = 0;
        
        while(!isUnique) {
            const randomString = Math.random().toString(36).substring(2, 8);
            uniqueSlug = attempt === 0 ? baseSlug : `${baseSlug}-${randomString}`;
            
            const publicDocRef = doc(db, 'publicSummaries', uniqueSlug);
            const publicDocSnap = await getDoc(publicDocRef);
            
            if (!publicDocSnap.exists()) {
                isUnique = true;
            }
            attempt++;
        }

        // Create a public version of the summary
        const publicSummaryData = {
            title: summaryData.title,
            summary: summaryData.summary,
            keywords: summaryData.keywords,
            originalOwnerId: userId,
            createdAt: summaryData.createdAt,
            publishedAt: serverTimestamp(),
            publicSlug: uniqueSlug
        };

        await setDoc(doc(db, 'publicSummaries', uniqueSlug), publicSummaryData);
        
        // Update the private summary to mark it as public
        await updateDoc(privateSummaryRef, {
            isPublic: true,
            publicSlug: uniqueSlug
        });

        revalidatePath('/my-content/summaries');
        revalidatePath(`/summaries/${uniqueSlug}`);

        return { success: true, slug: uniqueSlug };
    } catch (error) {
        console.error("Error making summary public: ", error);
        return { success: false, error: "An unknown error occurred." };
    }
}