'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { updateLastViewed } from '@/lib/content-actions';
import { Loader2 } from 'lucide-react';
import { FlashcardViewer } from '@/components/flashcard-viewer';

export default function FlashcardSetViewerPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [flashcardSet, setFlashcardSet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchFlashcardSet = async () => {
      const docRef = doc(db, 'users', user.uid, 'flashcardSets', params.id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setFlashcardSet(docSnap.data());
        updateLastViewed(user.uid, params.id, 'flashcardSet');
      } else {
        notFound();
      }
      setIsLoading(false);
    };

    fetchFlashcardSet();
  }, [user, params.id]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!flashcardSet) {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">{flashcardSet.title}</h1>
      <FlashcardViewer flashcards={flashcardSet.flashcards} />
    </main>
  );
}
