// src/app/plans/[slug]/page.tsx
import { db } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

type Props = {
  params: { slug: string };
};

async function getStudyPlan(slug: string) {
  const planRef = db.collection('publicStudyPlans').doc(slug);
  const planSnap = await planRef.get();

  if (!planSnap.exists) {
    return null;
  }
  return planSnap.data();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const plan = await getStudyPlan(params.slug);

  if (!plan) {
    return {
      title: 'Study Plan Not Found',
    };
  }

  return {
    title: `${plan.title} | FocusFlow AI Study Plan`,
    description: `A study plan for ${plan.title}.`,
    keywords: ['study plan', 'learning schedule', plan.title],
  };
}

export default async function PublicStudyPlanPage({ params }: Props) {
  const plan = await getStudyPlan(params.slug);

  if (!plan) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    'name': plan.title,
    'step': Object.entries(plan.plan).map(([day, tasks]) => ({
        '@type': 'HowToStep',
        'name': day,
        'itemListElement': (tasks as string[]).map(task => ({
            '@type': 'HowToDirection',
            'text': task,
        }))
    }))
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <article className="prose dark:prose-invert lg:prose-xl mx-auto">
            <h1>{plan.title}</h1>
            {Object.entries(plan.plan).map(([day, tasks]) => (
                <div key={day}>
                    <h2>{day}</h2>
                    <ul>
                        {(tasks as string[]).map((task, index) => (
                            <li key={index}>{task}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </article>
      </main>
      <Footer />
    </>
  );
}
