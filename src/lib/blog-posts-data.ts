// src/lib/blog-posts-data.ts
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Use client SDK instead of admin

export interface BlogPost {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    author: string;
    publishedAt: string;
    publicSlug: string;
    tags: string[];
}

// Helper to convert Firestore Timestamp to a serializable format (ISO string)
const processDoc = (doc: any) => {
    const data = doc.data();
    // Ensure publishedAt is a serializable string
    const publishedAtDate = data.publishedAt?.toDate ? data.publishedAt.toDate() : new Date();
    
    return {
        id: doc.id,
        ...data,
        publishedAt: publishedAtDate.toISOString(),
    } as BlogPost;
};


export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
    const collectionRef = collection(db, 'publicBlogPosts');
    const q = query(collectionRef, where('publicSlug', '==', slug));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return undefined;
    }

    const doc = snapshot.docs[0];
    return processDoc(doc);
}

export async function getBlogPosts(): Promise<BlogPost[]> {
    const collectionRef = collection(db, 'publicBlogPosts');
    const q = query(collectionRef, orderBy('publishedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(processDoc);
}
