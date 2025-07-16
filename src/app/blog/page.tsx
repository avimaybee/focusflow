
import Link from 'next/link';
import { posts } from '@/lib/blog-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoveRight } from 'lucide-react';

export default function BlogIndexPage() {
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
          {posts.map((post) => (
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
                      {post.author} &middot; {post.date}
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
