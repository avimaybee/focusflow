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

export interface PublicFlashcardSet {
    id: string;
    title: string;
    publishedAt: string;
    publicSlug: string;
}

export interface PublicQuiz {
    id: string;
    title: string;
    publishedAt: string;
    publicSlug: string;
}

export interface PublicStudyPlan {
    id: string;
    title: string;
    publishedAt: string;
    publicSlug: string;
}

export async function getPublicSummaries(): Promise<PublicSummary[]> {
    const snapshot = await db.collection('publicSummaries').get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            title: data.title,
            summary: data.summary,
            keywords: data.keywords,
            publishedAt: (data.publishedAt as Timestamp).toDate().toISOString(),
            publicSlug: data.publicSlug,
        }
    });
}

export async function getPublicFlashcardSets(): Promise<PublicFlashcardSet[]> {
    const snapshot = await db.collection('publicFlashcardSets').get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            title: data.title,
            publishedAt: (data.publishedAt as Timestamp).toDate().toISOString(),
            publicSlug: data.publicSlug,
        }
    });
}

export async function getPublicQuizzes(): Promise<PublicQuiz[]> {
    const snapshot = await db.collection('publicQuizzes').get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            title: data.title,
            publishedAt: (data.publishedAt as Timestamp).toDate().toISOString(),
            publicSlug: data.publicSlug,
        }
    });
}

export async function getPublicStudyPlans(): Promise<PublicStudyPlan[]> {
    const snapshot = await db.collection('publicStudyPlans').get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            title: data.title,
            publishedAt: (data.publishedAt as Timestamp).toDate().toISOString(),
            publicSlug: data.publicSlug,
        }
    });
}
