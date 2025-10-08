
'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { currentAnnouncement } from '@/lib/announcement-config';

export function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (currentAnnouncement) {
      const hasBeenDismissed = localStorage.getItem(currentAnnouncement.id);
      if (!hasBeenDismissed) {
        setIsVisible(true);
      }
    }
  }, []);

  if (!currentAnnouncement || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    if (!currentAnnouncement) return;
    localStorage.setItem(currentAnnouncement.id, 'true');
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
            <span className="announcement-badge">{currentAnnouncement.badge}</span>
            <Link href={currentAnnouncement.href} className="announcement-message hover:text-foreground transition-colors">
              {currentAnnouncement.message} <ArrowUpRight className="h-4 w-4" />
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
