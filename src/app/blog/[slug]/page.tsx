
import { getPostBySlug as getLocalPost, getBlogPosts as getLocalBlogPosts } from '@/lib/blog-data';
import { getBlogPost, getBlogPosts as getDbBlogPosts } from '@/lib/blog-posts-data';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { format } from 'date-fns';
import { marked } from 'marked';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type Props = {
  params: { slug: string };
};

async function getPost(slug: string) {
    const localPost = getLocalPost(slug);
    if (localPost) {
        return {
            ...localPost,
            content: await marked.parse(localPost.content),
            source: 'local'
        };
    }

    const dbPost = await getBlogPost(slug);
    if (dbPost) {
        return {
            ...dbPost,
            content: await marked.parse(dbPost.content),
            source: 'db'
        };
    }

    return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const post = await getPost(params.slug);

    if (!post) {
        return {
            title: 'Post Not Found',
        };
    }

    return {
        title: `${post.title} | FocusFlow AI Blog`,
        description: post.excerpt,
    };
}

export default async function BlogPostPage({ params }: Props) {
    const post = await getPost(params.slug);

    if (!post) {
        notFound();
    }

    const publishedDate = format(new Date(post.source === 'local' ? post.datePublished : post.publishedAt), 'MMMM d, yyyy');

    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <Button variant="ghost" asChild className="mb-8">
                <Link href="/blog">← Back to Blog</Link>
            </Button>
            <article>
                <header className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold font-heading text-center leading-tight">
                        {post.title}
                    </h1>
                    <p className="mt-4 text-center text-muted-foreground">
                        By {post.author} on {publishedDate}
                    </p>
                </header>
                <div
                    className="prose prose-lg prose-invert mx-auto"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
            </article>
        </div>
    );
}
