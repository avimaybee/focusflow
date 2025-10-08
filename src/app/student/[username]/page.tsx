'use client';

import { useEffect, useState } from 'react';
import { getPublicProfile } from '@/lib/profile-actions';
import { notFound } from 'next/navigation';
import { PublicHeader } from '@/components/dashboard/public-header';
import { PublishedContentGrid } from '@/components/dashboard/published-content-grid';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export default function PublicProfilePage({ params }: { params: { username: string } }) {
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getPublicProfile(params.username).then(data => {
      if (!data) {
        notFound();
      } else {
        setProfileData(data);
      }
      setIsLoading(false);
    });
  }, [params.username]);

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!profileData) {
    return null; // notFound will have been called
  }

  const { profile, content } = profileData;
  const isOwner = user?.id === profileData.userId;

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <PublicHeader profile={profile} username={params.username} isOwner={isOwner} />
      <PublishedContentGrid content={content} />
    </main>
  );
}
