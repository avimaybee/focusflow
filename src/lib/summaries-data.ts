import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, Timestamp } from 'firebase/firestore';

export interface PublicSummary {
    id: string;
    title: string;
    summary: string;
    keywords: string[];
    publishedAt: string;
    publicSlug: string;
}

export async function getPublicSummary(slug: string): Promise<PublicSummary | undefined> {
    const docRef = doc(db, 'publicSummaries', slug);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return undefined;
    }

    const data = docSnap.data();
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
    const collectionRef = collection(db, 'publicSummaries');
    const snapshot = await getDocs(collectionRef);
    
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
