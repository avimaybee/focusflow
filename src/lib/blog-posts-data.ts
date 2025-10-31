// src/lib/blog-posts-data.ts
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

// This file is for future database-driven blog posts
// Currently using static blog posts from blog-data.ts
const dbBlogPosts: BlogPost[] = [];

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
    // Future: Fetch from database
    // For now, return undefined to use static posts from blog-data.ts
    return dbBlogPosts.find(post => post.publicSlug === slug);
}

export async function getBlogPosts(): Promise<BlogPost[]> {
    // Future: Fetch from database
    // For now, return empty array to use static posts from blog-data.ts
    return dbBlogPosts;
}