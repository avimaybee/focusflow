
import { db } from '@/lib/firebase-admin'; // Use Firebase Admin SDK
import { Timestamp } from 'firebase-admin/firestore';

export interface PublicSummary {
    id: string;
    title: string;
    summary: string;
    keywords: string[];
    publishedAt: string;
    publicSlug: string;
}

export async function getPublicSummary(slug: string): Promise<PublicSummary | undefined> {
    const docRef = db.collection('publicSummaries').doc(slug);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        return undefined;
    }

    const data = docSnap.data()!;
    const publishedAt = (data.publishedAt as Timestamp).toDate().toISOString();

    return {
        id: docSnap.id,
        title: data.title,
        summary: data.summary,
        keywords: data.keywords,
        publishedAt: publishedAt,
        publicSlug: data.publicSlug,
    };
}

export async function getPublicSummaries(): Promise<PublicSummary[]> {
    const collectionRef = db.collection('publicSummaries');
    const snapshot = await collectionRef.get();
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const publishedAt = (data.publishedAt as Timestamp).toDate().toISOString();
        return {
            id: doc.id,
            title: data.title,
            summary: data.summary,
            keywords: data.keywords,
            publishedAt: publishedAt,
            publicSlug: data.publicSlug,
        }
    });
}
