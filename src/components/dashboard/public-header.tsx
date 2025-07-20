'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Share2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface PublicHeaderProps {
  profile: {
    displayName: string;
    school: string;
    bio: string;
    avatarUrl: string;
  };
  username: string;
  isOwner: boolean;
}

export function PublicHeader({ profile, username, isOwner }: PublicHeaderProps) {
  const { toast } = useToast();

  const handleShare = () => {
    const url = `${window.location.origin}/student/${username}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Success!', description: 'Profile URL copied to clipboard.' });
  };

  return (
    <header className="flex flex-col md:flex-row items-start text-center md:text-left md:items-center gap-6 mb-12 border-b pb-8">
      <Avatar className="h-24 w-24 text-3xl">
        <AvatarImage src={profile.avatarUrl} />
        <AvatarFallback>{profile.displayName?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <h1 className="text-4xl font-bold">{profile.displayName}</h1>
        <p className="text-lg text-muted-foreground">{profile.school}</p>
        <p className="mt-2 max-w-prose">{profile.bio}</p>
      </div>
      <div className="flex items-center gap-2">
        {isOwner && (
          <Link href="/preferences/profile">
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
        )}
        <Button onClick={handleShare} variant="outline">
          <Share2 className="h-4 w-4 mr-2" />
          Share Profile
        </Button>
      </div>
    </header>
  );
}
