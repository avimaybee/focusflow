import { getPublicSummary, getPublicSummaries } from "@/lib/summaries-data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { FileText } from "lucide-react";

type PublicSummaryPageProps = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  const summaries = await getPublicSummaries();
  return summaries.map(summary => ({ slug: summary.publicSlug }));
}

export async function generateMetadata({ params }: PublicSummaryPageProps) {
  const summary = await getPublicSummary(params.slug);
  if (!summary) {
    return { title: "Summary Not Found" };
  }
  
  const description = summary.summary.slice(0, 160);

  return {
    title: `${summary.title} | AI Summary | FocusFlow AI`,
    description: description,
    keywords: summary.keywords.join(', '),
  };
}


export default async function PublicSummaryPage({ params }: PublicSummaryPageProps) {
  const summary = await getPublicSummary(params.slug);

  if (!summary) {
    notFound();
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://focusflow.ai/summaries/${summary.publicSlug}`,
    },
    headline: summary.title,
    description: summary.summary,
    keywords: summary.keywords.join(','),
    author: {
      '@type': 'Organization',
      name: 'FocusFlow AI',
    },
    publisher: {
      '@type': 'Organization',
      name: 'FocusFlow AI',
    },
    datePublished: summary.publishedAt,
    dateModified: summary.publishedAt,
  };

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
       <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        key="summary-structured-data"
      />
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 text-primary mb-4">
            <FileText className="h-6 w-6" />
            <span className="font-semibold">AI-Generated Summary</span>
          </div>
          <CardTitle className="font-headline text-4xl">{summary.title}</CardTitle>
          <CardDescription>
            Published on {format(new Date(summary.publishedAt), 'MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div>
              <h2 className="font-headline text-2xl font-semibold mb-4">Summary</h2>
              <p className="text-lg leading-relaxed whitespace-pre-wrap">{summary.summary}</p>
            </div>
            <div>
                <h3 className="font-headline text-xl font-semibold mb-3">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                {summary.keywords.map(keyword => <Badge key={keyword} variant="secondary">{keyword}</Badge>)}
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
