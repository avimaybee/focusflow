'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PublicHeaderProps {
  profile: {
    displayName: string;
    school: string;
    bio: string;
    avatarUrl: string;
  };
  username: string;
}

export function PublicHeader({ profile, username }: PublicHeaderProps) {
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
      <Button onClick={handleShare} variant="outline">
        <Share2 className="h-4 w-4 mr-2" />
        Share Profile
      </Button>
    </header>
  );
}
