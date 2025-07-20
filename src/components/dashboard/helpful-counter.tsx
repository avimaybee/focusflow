'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import { incrementHelpfulCount } from '@/lib/profile-actions';
import { useToast } from '@/hooks/use-toast';

interface HelpfulCounterProps {
  contentId: string;
  contentType: string;
  initialCount: number;
}

export function HelpfulCounter({ contentId, contentType, initialCount }: HelpfulCounterProps) {
  const [count, setCount] = useState(initialCount);
  const [hasLiked, setHasLiked] = useState(false);
  const { toast } = useToast();

  const handleLike = async () => {
    if (hasLiked) {
      toast({ title: 'Already Liked', description: "You've already found this helpful." });
      return;
    }
    
    setHasLiked(true);
    setCount(prev => prev + 1);

    try {
      await incrementHelpfulCount(contentId, contentType);
    } catch (error) {
      setCount(prev => prev - 1); // Revert on error
      setHasLiked(false);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not register like.' });
    }
  };

  return (
    <Button onClick={handleLike} variant="outline" size="sm" disabled={hasLiked}>
      <ThumbsUp className="h-4 w-4 mr-2" />
      {count}
    </Button>
  );
}
