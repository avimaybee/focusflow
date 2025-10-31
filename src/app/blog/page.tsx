
import Link from 'next/link';
import { getBlogPosts as getLocalBlogPosts } from '@/lib/blog-data';
import { getBlogPosts as getDbBlogPosts } from '@/lib/blog-posts-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoveRight } from 'lucide-react';
import { format } from 'date-fns';

export default async function BlogIndexPage() {
  const localPosts = getLocalBlogPosts();
  const dbPosts = await getDbBlogPosts();

  const allPosts = [
    ...localPosts.map(p => ({ ...p, date: new Date(p.datePublished) })),
    ...dbPosts.map(p => ({ ...p, slug: p.publicSlug, date: new Date(p.publishedAt) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold font-heading">
            The FocusFlow Blog
          </h1>
          <p className="mt-4 text-lg text-foreground/75 font-medium">
            Insights on AI, learning science, and productivity.
          </p>
        </header>
        <div className="space-y-6">
          {allPosts.map((post) => (
            <Link href={`/blog/${post.slug}`} key={post.slug} passHref>
              <Card className="group hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/75 mb-4 font-normal">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-foreground/70">
                    <span className="font-medium">
                      {post.author} &middot; {format(post.date, 'MMMM d, yyyy')}
                    </span>
                    <span className="flex items-center group-hover:text-primary transition-colors font-semibold">
                      Read More <MoveRight className="ml-2 h-4 w-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
