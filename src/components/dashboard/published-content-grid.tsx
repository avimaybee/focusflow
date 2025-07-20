'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HelpfulCounter } from './helpful-counter';

interface ContentItem {
  id: string;
  type: string;
  title: string;
  publicSlug: string;
  helpfulCount: number;
  authorId: string;
}

interface PublishedContentGridProps {
  content: ContentItem[];
}

export function PublishedContentGrid({ content }: PublishedContentGridProps) {
  const [filter, setFilter] = useState('All');

  const filteredContent = content.filter(
    item => filter === 'All' || item.type === filter.toLowerCase().slice(0, -1)
  );

  const filters = ['All', 'Summaries', 'Quizzes', 'FlashcardSets', 'StudyPlans'];

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Published Content</h2>
        <div className="flex items-center gap-2">
          {filters.map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'ghost'}
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContent.map((item: any) => (
          <Card key={item.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <p className="text-muted-foreground line-clamp-3 mb-4">
                {/* Description will be added later */}
              </p>
              <div className="flex items-center justify-between">
                <Link href={`/${item.type}s/${item.publicSlug}`} passHref>
                  <Button asChild>
                    <a>View</a>
                  </Button>
                </Link>
                <HelpfulCounter authorId={item.authorId} contentId={item.id} contentType={item.type} initialCount={item.helpfulCount} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
