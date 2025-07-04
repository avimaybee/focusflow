import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getBlogPosts, BlogPost } from "@/lib/blog-data";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Blog | FocusFlow AI",
  description: "Explore articles on AI, productivity, and study techniques to help you learn smarter.",
};

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4">
      <div className="text-center mb-12">
        <BookOpen className="mx-auto h-12 w-12 text-primary" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold mt-4">FocusFlow AI Blog</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Insights on AI, productivity, and effective study habits.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <Card key={post.slug} className="flex flex-col">
            <CardHeader>
              <div className="aspect-video relative">
                <Image 
                  src={post.image} 
                  alt={post.title} 
                  fill 
                  className="rounded-t-lg object-cover"
                  data-ai-hint="study productivity"
                />
              </div>
              <CardTitle className="font-headline text-xl pt-4">{post.title}</CardTitle>
              <CardDescription>{post.excerpt}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex flex-wrap gap-2">
                {post.keywords.map(keyword => <Badge key={keyword} variant="secondary">{keyword}</Badge>)}
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/blog/${post.slug}`} className="font-bold text-primary hover:underline flex items-center">
                Read More <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
