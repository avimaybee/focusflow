export const runtime = 'edge';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { FlashcardViewer } from '@/components/flashcard-viewer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

type Props = {
  params: { slug: string };
};

async function getFlashcardSet(slug: string) {
  // Placeholder for fetching data from Supabase
  if (slug === 'placeholder') {
    return {
      set: {
        title: 'Placeholder Flashcard Set',
        flashcards: [
          { question: 'What is the capital of France?', answer: 'Paris' },
          { question: 'What is 2 + 2?', answer: '4' },
        ],
        sourceText: 'Placeholder Topic',
        authorId: 'placeholder-author',
        id: 'placeholder-id',
      },
      author: {
        username: 'placeholder-user',
        displayName: 'Placeholder User',
        avatarUrl: '',
      },
    };
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getFlashcardSet(params.slug);

  if (!data?.set) {
    return { title: 'Flashcard Set Not Found' };
  }
  const { set } = data;

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
  const data = await getFlashcardSet(params.slug);

  if (!data?.set) {
    notFound();
  }

  const { set, author } = data;

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4 text-center">{set.title}</h1>
      {author && (
        <Link href={`/student/${author.username}`}>
            <div className="flex items-center justify-center gap-4 mb-8">
                <Avatar>
                    <AvatarImage src={author.avatarUrl} />
                    <AvatarFallback>{author.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{author.displayName}</p>
                    <p className="text-sm text-muted-foreground">View Profile</p>
                </div>
            </div>
        </Link>
      )}
      <FlashcardViewer flashcards={set.flashcards} />
    </main>
  );
}