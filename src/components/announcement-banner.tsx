
'use client';

import { useState, useEffect, useMemo } from 'react';
import { ExternalLink, X } from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { currentAnnouncement } from '@/lib/announcement-config';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

export function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);

  const announcementId = currentAnnouncement?.id ?? null;

  const storageKey = useMemo(() => {
    if (!announcementId) return null;
    return `announcement-dismissed-${announcementId}`;
  }, [announcementId]);

  useEffect(() => {
    if (!currentAnnouncement || !storageKey) {
      return;
    }

    try {
      const storedDismissal = localStorage.getItem(storageKey);
      if (!storedDismissal) {
        setIsVisible(true);
      }
    } catch (error) {
      console.warn('[AnnouncementBanner] Unable to read dismissal state:', error);
      setIsVisible(true);
    }
  }, [storageKey]);

  if (!currentAnnouncement || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    if (!currentAnnouncement || !storageKey) return;
    try {
      localStorage.setItem(storageKey, new Date().toISOString());
    } catch (error) {
      console.warn('[AnnouncementBanner] Unable to persist dismissal state:', error);
    } finally {
      setIsVisible(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={cn('announcement-banner', isLoggedIn && 'py-1')}
          role="status"
          aria-live="polite"
        >
          <div
            className={cn(
              'announcement-wrapper',
              isLoggedIn && 'border-border/60 bg-secondary/30 shadow-sm'
            )}
          >
            <span
              className="announcement-badge"
              aria-label={currentAnnouncement.badge === 'New' ? 'New announcement' : undefined}
            >
              {currentAnnouncement.badge}
            </span>
            <Link
              href={currentAnnouncement.href}
              className={cn(
                'announcement-message hover:text-foreground transition-colors',
                isLoggedIn && 'text-muted-foreground/80'
              )}
            >
              {currentAnnouncement.message} <ExternalLink className="h-4 w-4" />
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
