'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { marked } from 'marked';
import { BackButton } from '@/components/ui/back-button';

interface SavedMessage {
  content: string;
  createdAt: Date; // Replaced Timestamp with Date
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
  const [editMode, setEditMode] = useState(false);
  const [renderedContent, setRenderedContent] = useState('');

  useEffect(() => {
    // Placeholder for fetching data from Supabase
    if (messageId) {
        const placeholderMessage = {
            content: 'This is a placeholder saved message.',
            createdAt: new Date(),
        };
        setMessage(placeholderMessage);
        setContent(placeholderMessage.content);
        marked.parse(placeholderMessage.content).then(setRenderedContent);
    }
    setIsLoading(false);
  }, [messageId]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasChanges(true);
  };

  const handleUpdate = async () => {
    if (!hasChanges) {
      setEditMode(false);
      return;
    };
    setIsSaving(true);
    // Placeholder for update logic
    setTimeout(async () => {
        setRenderedContent(await marked.parse(content));
        toast({ title: 'Success!', description: 'Saved message has been updated (placeholder).' });
        setHasChanges(false);
        setEditMode(false);
        setIsSaving(false);
    }, 1000);
  };
  
  const handleToggleEdit = () => {
    if (editMode && hasChanges) {
        handleUpdate();
    } else {
        setEditMode(!editMode);
    }
  }

  if (isLoading || authLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
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
          <BackButton href="/my-content" label="Back to My Content" />
          <Button onClick={handleToggleEdit} disabled={isSaving}>
            {editMode ? (
                isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />
            ) : (
                <Pencil className="mr-2 h-4 w-4" />
            )}
            {editMode ? 'Save' : 'Edit'}
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Saved Message</CardTitle>
            <CardDescription>
              Saved on {format(message.createdAt, 'MMMM dd, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {editMode ? (
                <Textarea
                    value={content}
                    onChange={handleContentChange}
                    className="w-full h-auto min-h-[400px] border rounded-md p-2 bg-transparent text-base focus-visible:ring-1"
                    placeholder="Start writing..."
                />
            ) : (
                 <div
                    className="prose-styles min-h-[400px]"
                    dangerouslySetInnerHTML={{ __html: renderedContent }}
                />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}