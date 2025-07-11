
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Rocket, X } from 'lucide-react';
import Link from 'next/link';

const ANNOUNCEMENT_ID = 'earlyAccessBetaAnnouncement';

export function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasBeenDismissed = localStorage.getItem(ANNOUNCEMENT_ID);
    if (!hasBeenDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(ANNOUNCEMENT_ID, 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="relative bg-primary/10 border-b border-primary/20 text-sm text-center p-2">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <Rocket className="h-4 w-4" />
        <p>
          <span className="font-semibold">Early Access Beta:</span> All Premium features are free for a limited time.{' '}
          <Link href="/premium" className="underline hover:opacity-80">
            Learn More
          </Link>
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1/2 right-4 -translate-y-1/2 h-6 w-6"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
