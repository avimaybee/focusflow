import { db } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { incrementViews } from '@/lib/profile-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

type Props = {
  params: { slug: string };
};

async function getStudyPlan(slug: string) {
  const planRef = db.collection('publicStudyPlans').doc(slug);
  const planSnap = await planRef.get();

  if (!planSnap.exists) {
    return null;
  }
  
  const planData = planSnap.data();
  if (!planData?.authorId) {
    return { plan: planData, author: null };
  }

  const authorRef = db.collection('users').doc(planData.authorId);
  const authorSnap = await authorRef.get();
  
  const authorData = authorSnap.exists() ? authorSnap.data()?.publicProfile : null;

  return { plan: planData, author: authorData };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getStudyPlan(params.slug);

  if (!data?.plan) {
    return { title: 'Study Plan Not Found' };
  }
  const { plan } = data;

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
  const data = await getStudyPlan(params.slug);

  if (!data?.plan) {
    notFound();
  }

  const { plan, author } = data;

  if (plan.authorId && plan.id) {
    incrementViews(plan.authorId, plan.id, 'studyPlan');
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="prose dark:prose-invert lg:prose-xl mx-auto">
        <h1>{plan.title}</h1>
        {author && (
            <Link href={`/student/${author.username}`}>
                <div className="flex items-center gap-4 mb-8 not-prose">
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
