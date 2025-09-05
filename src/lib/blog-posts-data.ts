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

const placeholderBlogPosts: BlogPost[] = [
    {
        id: '1',
        title: 'Placeholder Blog Post 1',
        content: 'This is the content of the first placeholder blog post.',
        excerpt: 'This is the excerpt of the first placeholder blog post.',
        author: 'Placeholder Author',
        publishedAt: new Date().toISOString(),
        publicSlug: 'placeholder-1',
        tags: ['placeholder', 'blog'],
    },
    {
        id: '2',
        title: 'Placeholder Blog Post 2',
        content: 'This is the content of the second placeholder blog post.',
        excerpt: 'This is the excerpt of the second placeholder blog post.',
        author: 'Placeholder Author',
        publishedAt: new Date().toISOString(),
        publicSlug: 'placeholder-2',
        tags: ['placeholder', 'blog'],
    },
];

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
    return placeholderBlogPosts.find(post => post.publicSlug === slug);
}

export async function getBlogPosts(): Promise<BlogPost[]> {
    return placeholderBlogPosts;
}