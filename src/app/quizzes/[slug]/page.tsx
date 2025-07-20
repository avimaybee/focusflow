import { db } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { QuizViewer } from '@/components/quiz-viewer';
import { incrementViews } from '@/lib/profile-actions';

type Props = {
  params: { slug: string };
};

async function getQuiz(slug: string) {
  const quizRef = db.collection('publicQuizzes').doc(slug);
  const quizSnap = await quizRef.get();

  if (!quizSnap.exists) {
    return null;
  }
  return quizSnap.data();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const quiz = await getQuiz(params.slug);

  if (!quiz) {
    return { title: 'Quiz Not Found' };
  }

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
  const quiz = await getQuiz(params.slug);

  if (!quiz) {
    notFound();
  }

  // Increment views - fire and forget
  if (quiz.authorId && quiz.id) {
    incrementViews(quiz.authorId, quiz.id, 'quiz');
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <QuizViewer quiz={quiz.quiz} />
    </main>
  );
}