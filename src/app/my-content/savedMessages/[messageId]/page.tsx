
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { marked } from 'marked';

interface SavedMessage {
  content: string;
  createdAt: Timestamp;
}

export default function SavedMessageDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const messageId = params.messageId as string;
  const [message, setMessage] = useState<SavedMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user && messageId) {
      const fetchMessage = async () => {
        setIsLoading(true);
        const docRef = doc(db, 'users', user.uid, 'savedMessages', messageId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as SavedMessage;
          setMessage(data);
          const parsedHtml = await marked.parse(data.content);
          setHtmlContent(parsedHtml);
        } else {
          setMessage(null);
        }
        setIsLoading(false);
      };

      fetchMessage();
    }
  }, [user, messageId, authLoading, router]);

  if (isLoading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!message) {
    notFound();
  }

  return (
    <main className="flex-grow bg-secondary/30">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" asChild className="mb-4">
            <Link href="/my-content">← Back to My Content</Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Saved Message</CardTitle>
            <CardDescription>
              Saved on {format(message.createdAt.toDate(), 'MMMM dd, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
                className="prose prose-invert max-w-none" 
                dangerouslySetInnerHTML={{ __html: htmlContent }} 
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
