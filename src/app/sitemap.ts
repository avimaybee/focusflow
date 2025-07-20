import { getBlogPosts as getLocalBlogPosts } from '@/lib/blog-data';
import { getBlogPosts as getDbBlogPosts } from '@/lib/blog-posts-data';
import { getPublicSummaries, getPublicFlashcardSets, getPublicQuizzes, getPublicStudyPlans, getAllUsernames } from '@/lib/public-content-data';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://focusflow.ai';

  // Get all usernames for public profiles
  const usernames = await getAllUsernames();
  const profileUrls = usernames.map(username => ({
    url: `${baseUrl}/student/${username}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Get all blog posts
  const localBlogPosts = getLocalBlogPosts();
  const localBlogPostUrls = localBlogPosts
    .filter(post => post && post.slug)
    .map(post => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.datePublished),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));

  const dbBlogPosts = await getDbBlogPosts();
  const dbBlogPostUrls = dbBlogPosts
    .filter(post => post && post.publicSlug)
    .map(post => ({
        url: `${baseUrl}/blog/${post.publicSlug}`,
        lastModified: new Date(post.publishedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));
  
  // Get all public summaries
  const summaries = await getPublicSummaries();
  const summaryUrls = summaries
    .filter(summary => summary && summary.publicSlug)
    .map(summary => ({
      url: `${baseUrl}/summaries/${summary.publicSlug}`,
      lastModified: new Date(summary.publishedAt),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    }));

  // Get all public flashcard sets
  const flashcardSets = await getPublicFlashcardSets();
  const flashcardUrls = flashcardSets
    .filter(set => set && set.publicSlug)
    .map(set => ({
      url: `${baseUrl}/flashcards/${set.publicSlug}`,
      lastModified: new Date(set.publishedAt),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    }));

  // Get all public quizzes
  const quizzes = await getPublicQuizzes();
  const quizUrls = quizzes
    .filter(quiz => quiz && quiz.publicSlug)
    .map(quiz => ({
      url: `${baseUrl}/quizzes/${quiz.publicSlug}`,
      lastModified: new Date(quiz.publishedAt),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    }));

  // Get all public study plans
  const studyPlans = await getPublicStudyPlans();
  const studyPlanUrls = studyPlans
    .filter(plan => plan && plan.publicSlug)
    .map(plan => ({
      url: `${baseUrl}/plans/${plan.publicSlug}`,
      lastModified: new Date(plan.publishedAt),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    }));


  // Define static routes
  const staticRoutes = [
    '/',
    '/chat',
    '/dashboard',
    '/my-content',
    '/premium',
    '/blog',
  ];

  const staticUrls = staticRoutes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1.0 : 0.9,
  }));

  return [
    ...staticUrls,
    ...localBlogPostUrls,
    ...dbBlogPostUrls,
    ...summaryUrls,
    ...flashcardUrls,
    ...quizUrls,
    ...studyPlanUrls,
    ...profileUrls,
  ];
}
