// src/lib/blog-posts-data.ts
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

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

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
    const collectionRef = db.collection('publicBlogPosts');
    const q = collectionRef.where('publicSlug', '==', slug);
    const snapshot = await q.get();

    if (snapshot.empty) {
        return undefined;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const publishedAt = (data.publishedAt as Timestamp).toDate().toISOString();

    return {
        id: doc.id,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        author: data.author,
        publishedAt: publishedAt,
        publicSlug: data.publicSlug,
        tags: data.tags || [],
    };
}

export async function getBlogPosts(): Promise<BlogPost[]> {
    const collectionRef = db.collection('publicBlogPosts');
    const snapshot = await collectionRef.orderBy('publishedAt', 'desc').get();
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const publishedAt = (data.publishedAt as Timestamp).toDate().toISOString();
        return {
            id: doc.id,
            title: data.title,
            content: data.content,
            excerpt: data.excerpt,
            author: data.author,
            publishedAt: publishedAt,
            publicSlug: data.publicSlug,
            tags: data.tags || [],
        }
    });
}
