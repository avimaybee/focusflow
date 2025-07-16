
// src/app/quizzes/[slug]/page.tsx
import { db } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { QuizViewer } from '@/components/quiz-viewer';

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
    return {
      title: 'Quiz Not Found',
    };
  }

  const description = `A ${quiz.quiz.questions.length}-question quiz on the topic of ${quiz.title}.`;

  return {
    title: `${quiz.title} | FocusFlow AI Quiz`,
    description: description,
    keywords: ['quiz', 'practice test', quiz.title],
  };
}

export default async function PublicQuizPage({ params }: Props) {
  const quiz = await getQuiz(params.slug);

  if (!quiz) {
    notFound();
  }
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    'name': quiz.title,
    'description': `A ${quiz.quiz.questions.length}-question quiz on the topic of ${quiz.title}.`,
  };

  return (
    <>
      <main className="container mx-auto px-4 py-12">
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <h1 className="text-3xl font-bold text-center mb-8">{quiz.title}</h1>
        <QuizViewer quiz={quiz.quiz} />
      </main>
    </>
  );
}
