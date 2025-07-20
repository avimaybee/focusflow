import { db } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { FlashcardViewer } from '@/components/flashcard-viewer';
import { incrementViews } from '@/lib/profile-actions';

type Props = {
  params: { slug: string };
};

async function getFlashcardSet(slug: string) {
  const setRef = db.collection('publicFlashcardSets').doc(slug);
  const setSnap = await setRef.get();

  if (!setSnap.exists) {
    return null;
  }
  return setSnap.data();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const set = await getFlashcardSet(params.slug);

  if (!set) {
    return { title: 'Flashcard Set Not Found' };
  }

  const description = `A set of flashcards on "${set.sourceText}" created with FocusFlow AI.`;

  return {
    title: `${set.title} | FocusFlow AI`,
    description,
    openGraph: {
      title: set.title,
      description,
      type: 'article',
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/flashcards/${params.slug}`,
      images: [{ url: `${process.env.NEXT_PUBLIC_BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'FocusFlow AI' }],
    },
  };
}

export default async function PublicFlashcardSetPage({ params }: Props) {
  const set = await getFlashcardSet(params.slug);

  if (!set) {
    notFound();
  }

  if (set.authorId && set.id) {
    incrementViews(set.authorId, set.id, 'flashcardSet');
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">{set.title}</h1>
      <FlashcardViewer flashcards={set.flashcards} />
    </main>
  );
}