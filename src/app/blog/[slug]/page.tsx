import { getBlogPostBySlug, getBlogPosts } from "@/lib/blog-data";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

type BlogPostPageProps = {
  params: {
    slug: string;
  };
};

// Generate static pages for each blog post
export async function generateStaticParams() {
  const posts = getBlogPosts();
  return posts.map(post => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const post = getBlogPostBySlug(params.slug);
  if (!post) {
    return { title: "Post Not Found" };
  }
  return {
    title: `${post.title} | FocusFlow AI`,
    description: post.excerpt,
    keywords: post.keywords.join(', '),
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="container mx-auto max-w-3xl py-12 px-4">
      <div className="mb-8">
        <Link href="/blog" className="flex items-center text-primary hover:underline mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
        </Link>
      </div>

      <header className="mb-8">
        <div className="aspect-video relative mb-8">
          <Image 
            src={post.image} 
            alt={post.title} 
            fill 
            className="rounded-lg object-cover" 
            data-ai-hint="study productivity"
          />
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {post.keywords.map(keyword => <Badge key={keyword} variant="secondary">{keyword}</Badge>)}
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-bold">{post.title}</h1>
        <p className="text-muted-foreground text-lg mt-4">{post.excerpt}</p>
      </header>

      <div
        className="prose-styles"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
