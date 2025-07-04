import { getBlogPosts } from '@/lib/blog-data';
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://focusflow.ai';

  // Get all blog posts
  const blogPosts = getBlogPosts();
  const blogPostUrls = blogPosts.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.datePublished),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Define static routes
  const staticRoutes = [
    '/',
    '/summarizer',
    '/flashcards',
    '/quiz',
    '/planner',
    '/tracker',
    '/dashboard',
    '/blog',
    '/login',
    '/premium',
    '/my-content/summaries',
  ];

  const staticUrls = staticRoutes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1.0 : 0.9,
  }));

  return [
    ...staticUrls,
    ...blogPostUrls,
  ];
}
