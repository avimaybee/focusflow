
'use client';

// Placeholder page for viewing a single quiz.
// In the future, this will fetch quiz data and render the quiz viewer.

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function QuizDetailPage() {
  const params = useParams();

  return (
    <>
      <Header />
      <main className="flex-grow bg-secondary/30">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/my-content">← Back to My Content</Link>
            </Button>
          <Card>
            <CardHeader>
              <CardTitle>Quiz Details (WIP)</CardTitle>
               <CardDescription>
                This page will display your saved quiz.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading quiz: {params.quizId}</p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
