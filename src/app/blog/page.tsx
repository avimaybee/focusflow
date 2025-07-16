
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
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-heading">
            The FocusFlow Blog
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Insights on AI, learning science, and productivity.
          </p>
        </header>
        <div className="space-y-8">
          {allPosts.map((post) => (
            <Link href={`/blog/${post.slug}`} key={post.slug} passHref>
              <Card className="group hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {post.author} &middot; {format(post.date, 'MMMM d, yyyy')}
                    </span>
                    <span className="flex items-center group-hover:text-primary transition-colors">
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
