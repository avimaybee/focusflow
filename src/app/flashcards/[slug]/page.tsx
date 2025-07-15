// src/app/flashcards/[slug]/page.tsx
import { db } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { FlashcardViewer } from '@/components/flashcard-viewer';

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
    return {
      title: 'Flashcard Set Not Found',
    };
  }

  const description = `A set of ${set.flashcards.length} flashcards on the topic of ${set.title}.`;

  return {
    title: `${set.title} | FocusFlow AI Flashcards`,
    description: description,
    keywords: ['flashcards', 'study tool', set.title],
  };
}

export default async function PublicFlashcardPage({ params }: Props) {
  const set = await getFlashcardSet(params.slug);

  if (!set) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalMaterial',
    'name': set.title,
    'description': `A set of ${set.flashcards.length} flashcards on the topic of ${set.title}.`,
    'learningResourceType': 'Flashcards',
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-12">
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <h1 className="text-3xl font-bold text-center mb-8">{set.title}</h1>
        <FlashcardViewer flashcards={set.flashcards} />
      </main>
      <Footer />
    </>
  );
}
