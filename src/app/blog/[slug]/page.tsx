import { notFound } from 'next/navigation';
import { getPostBySlug } from '@/lib/blog-data';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <article>
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-center leading-tight">
              {post.title}
            </h1>
            <p className="mt-4 text-center text-muted-foreground">
              By {post.author} on {post.date}
            </p>
          </header>
          <div
            className="prose prose-lg prose-invert mx-auto"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </div>
      <Footer />
    </>
  );
}