
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { updateContent } from '@/lib/content-actions';

interface SavedMessage {
  content: string;
  createdAt: Timestamp;
}

export default function SavedMessageDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const messageId = params.messageId as string;

  const [message, setMessage] = useState<SavedMessage | null>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
          setContent(data.content);
        } else {
          setMessage(null);
        }
        setIsLoading(false);
      };

      fetchMessage();
    }
  }, [user, messageId, authLoading, router]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasChanges(true);
  };

  const handleUpdate = async () => {
    if (!user || !hasChanges) return;
    setIsSaving(true);
    try {
      await updateContent(user.uid, messageId, 'savedMessage', { content });
      toast({ title: 'Success!', description: 'Saved message has been updated.' });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to update message:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update the message.' });
    } finally {
      setIsSaving(false);
    }
  };

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
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" asChild>
            <Link href="/my-content">← Back to My Content</Link>
          </Button>
          <Button onClick={handleUpdate} disabled={!hasChanges || isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {hasChanges ? 'Save Changes' : 'Saved'}
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Saved Message</CardTitle>
            <CardDescription>
              Saved on {format(message.createdAt.toDate(), 'MMMM dd, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={content}
              onChange={handleContentChange}
              className="w-full h-auto min-h-[400px] border-none focus-visible:ring-0 p-0 bg-transparent text-base"
              placeholder="Start writing..."
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

    