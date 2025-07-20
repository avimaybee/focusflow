import { db } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { incrementViews } from '@/lib/profile-actions';

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
    return { title: 'Study Plan Not Found' };
  }

  const description = `A study plan for "${plan.sourceText}" created with FocusFlow AI.`;

  return {
    title: `${plan.title} | FocusFlow AI`,
    description,
    openGraph: {
      title: plan.title,
      description,
      type: 'article',
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/plans/${params.slug}`,
      images: [{ url: `${process.env.NEXT_PUBLIC_BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'FocusFlow AI' }],
    },
  };
}

export default async function PublicStudyPlanPage({ params }: Props) {
  const plan = await getStudyPlan(params.slug);

  if (!plan) {
    notFound();
  }

  if (plan.authorId && plan.id) {
    incrementViews(plan.authorId, plan.id, 'studyPlan');
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="prose dark:prose-invert lg:prose-xl mx-auto">
        <h1>{plan.title}</h1>
        {Object.entries(plan.plan).map(([day, tasks]) => (
          <div key={day}>
            <h2 className="text-2xl font-semibold mt-8 mb-4">{day}</h2>
            <ul className="list-disc pl-6 space-y-2">
              {(tasks as string[]).map((task, index) => (
                <li key={index}>{task}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}