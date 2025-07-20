import { getPublicProfile } from '@/lib/profile-actions';
import { notFound } from 'next/navigation';
import { PublicHeader } from '@/components/dashboard/public-header';
import { PublishedContentGrid } from '@/components/dashboard/published-content-grid';
import { Metadata } from 'next';

type Props = {
  params: { username: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPublicProfile(params.username);

  if (!data) {
    return {
      title: 'Profile Not Found',
    };
  }

  const { profile } = data;
  const title = `${profile.displayName}'s Study Hub | FocusFlow AI`;
  const description = profile.bio || `Explore study materials created by ${profile.displayName} on FocusFlow AI.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/student/${params.username}`,
      images: [
        {
          url: profile.avatarUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: profile.displayName,
        },
      ],
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const data = await getPublicProfile(params.username);

  if (!data) {
    notFound();
  }

  const { profile, content } = data;
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    'mainEntity': {
        '@type': 'Person',
        'name': profile.displayName,
        'description': profile.bio,
        'image': profile.avatarUrl,
        'url': `${process.env.NEXT_PUBLIC_BASE_URL}/student/${params.username}`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <PublicHeader profile={profile} username={params.username} />
        <PublishedContentGrid content={content} />
      </main>
    </>
  );
}
