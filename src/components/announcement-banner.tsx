
'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

const ANNOUNCEMENT_ID = 'featureAnnouncement_2025_07'; // Use a unique ID for each new announcement

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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="announcement-banner"
          role="status"
          aria-live="polite"
        >
          <div className="announcement-wrapper">
            <span className="announcement-badge">Latest update</span>
            <Link href="/premium" className="announcement-message hover:text-foreground transition-colors">
              New feature added <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss announcement"
            className="ml-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
