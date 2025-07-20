'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { updateLastViewed } from '@/lib/content-actions';
import { Loader2 } from 'lucide-react';

export default function SummaryViewerPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSummary = async () => {
      const docRef = doc(db, 'users', user.uid, 'summaries', params.id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setSummary(docSnap.data());
        // Update lastViewed timestamp
        updateLastViewed(user.uid, params.id, 'summary');
      } else {
        notFound();
      }
      setIsLoading(false);
    };

    fetchSummary();
  }, [user, params.id]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!summary) {
    return null; // notFound() will have been called
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
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
  );
}