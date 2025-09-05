import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { QuizViewer } from '@/components/quiz-viewer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

type Props = {
  params: { slug: string };
};

async function getQuiz(slug: string) {
  // Placeholder for fetching data from Supabase
  if (slug === 'placeholder') {
    return {
      quiz: {
        title: 'Placeholder Quiz',
        quiz: {
            title: 'Placeholder Quiz',
            questions: [
                {
                    question: 'What is the capital of France?',
                    options: ['London', 'Berlin', 'Paris', 'Madrid'],
                    correctAnswer: 'Paris',
                    explanation: 'Paris is the capital of France.',
                },
            ],
        },
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
  const data = await getQuiz(params.slug);

  if (!data?.quiz) {
    return { title: 'Quiz Not Found' };
  }
  const { quiz } = data;

  const description = `A quiz on "${quiz.sourceText}" created with FocusFlow AI.`;

  return {
    title: `${quiz.title} | FocusFlow AI`,
    description,
    openGraph: {
      title: quiz.title,
      description,
      type: 'article',
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/quizzes/${params.slug}`,
      images: [{ url: `${process.env.NEXT_PUBLIC_BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'FocusFlow AI' }],
    },
  };
}

export default async function PublicQuizPage({ params }: Props) {
  const data = await getQuiz(params.slug);

  if (!data?.quiz) {
    notFound();
  }

  const { quiz, author } = data;

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4 text-center">{quiz.title}</h1>
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
      <QuizViewer quiz={quiz.quiz} />
    </main>
  );
}