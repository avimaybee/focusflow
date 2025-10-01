
// src/app/summaries/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

type Props = {
  params: { slug: string };
};

// This is a server-side function to fetch the data for a public summary.
async function getSummary(slug: string) {
  // Placeholder for fetching data from Supabase
  if (slug === 'placeholder') {
    return {
      summary: {
        title: 'Placeholder Summary',
        summary: 'This is a placeholder summary.',
        keywords: ['placeholder', 'summary'],
        authorId: 'placeholder-author',
        id: 'placeholder-id',
        publishedAt: { _seconds: Math.floor(new Date().getTime() / 1000) },
      },
      author: {
        username: 'placeholder-user',
        displayName: 'Placeholder User',
        avatarUrl: '',
      },
    };
  }
  // Removed firebase import and usage as per the new placeholder logic
  // const summaryRef = db.collection('publicSummaries').doc(slug);
  // const summarySnap = await summaryRef.get();

  // if (!summarySnap.exists) {
  //   return null;
  // }
  
  // const summaryData = summarySnap.data();
  // if (!summaryData?.authorId) {
  //   return { summary: summaryData, author: null };
  // }

  // const authorRef = db.collection('users').doc(summaryData.authorId);
  // const authorSnap = await authorRef.get();
  
  // const authorData = authorSnap.exists() ? authorSnap.data()?.publicProfile : null;

  // return { summary: summaryData, author: authorData };
  return null; // Return null if not a placeholder and no data found
}

// This generates the dynamic metadata for the page.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getSummary(params.slug);

  if (!data?.summary) {
    return {
      title: 'Summary Not Found',
    };
  }
  const { summary } = data;

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
  const data = await getSummary(params.slug);

  if (!data?.summary) {
    notFound();
  }
  
  const { summary, author } = data;
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': summary.title,
    'author': {
        '@type': 'Person',
        'name': author?.displayName || 'FocusFlow AI User'
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
            {author && (
                <Link href={`/student/${author.username}`}>
                    <div className="flex items-center gap-4 mb-8 not-prose">
                        <Avatar>
                            <AvatarImage src={author.avatarUrl} />
                            <AvatarFallback>{author.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{author.displayName}</p>
                            <p className="text-sm text-muted-foreground">View Profile</p>
                        </div>
                    </div>
                </Link>
            )}
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