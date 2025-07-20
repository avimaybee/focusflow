
// src/app/summaries/[slug]/page.tsx
import { db } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

type Props = {
  params: { slug: string };
};

// This is a server-side function to fetch the data for a public summary.
async function getSummary(slug: string) {
  const summaryRef = db.collection('publicSummaries').doc(slug);
  const summarySnap = await summaryRef.get();

  if (!summarySnap.exists) {
    return null;
  }
  return summarySnap.data();
}

// This generates the dynamic metadata for the page.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const summary = await getSummary(params.slug);

  if (!summary) {
    return {
      title: 'Summary Not Found',
    };
  }

  const description = summary.summary.substring(0, 160);
  const keywords = summary.keywords || [];

  return {
    title: `${summary.title} | FocusFlow AI`,
    description: description,
    keywords: ['summary', 'AI summary', ...keywords],
    openGraph: {
        title: summary.title,
        description: description,
        type: 'article',
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/summaries/${params.slug}`,
        images: [
            {
                url: `${process.env.NEXT_PUBLIC_BASE_URL}/og-image.png`,
                width: 1200,
                height: 630,
                alt: 'FocusFlow AI',
            },
        ],
    },
  };
}

export default async function PublicSummaryPage({ params }: Props) {
  const summary = await getSummary(params.slug);

  if (!summary) {
    notFound();
  }
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': summary.title,
    'author': {
        '@type': 'Organization',
        'name': 'FocusFlow AI'
    },
    'datePublished': summary.publishedAt ? new Date(summary.publishedAt._seconds * 1000).toISOString() : new Date().toISOString(),
    'description': summary.summary.substring(0, 250),
    'articleBody': summary.summary,
  };

  return (
    <>
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <article className="prose dark:prose-invert lg:prose-xl mx-auto">
            <h1>{summary.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: summary.summary.replace(/\n/g, '<br />') }} />
            {summary.keywords && (
                <div className="mt-8">
                    <strong>Keywords:</strong> {summary.keywords.join(', ')}
                </div>
            )}
        </article>
      </main>
    </>
  );
}
