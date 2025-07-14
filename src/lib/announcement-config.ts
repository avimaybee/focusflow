/**
 * @fileoverview Centralized configuration for the announcement banner.
 * To update the banner, simply change the values in this file.
 */

interface AnnouncementConfig {
  id: string; // Unique ID for localStorage dismissal tracking. Change this for new announcements.
  badge: string;
  message: string;
  href: string;
}

export const currentAnnouncement: AnnouncementConfig | null = {
  id: 'dynamic-feature-announcement-2025-07-18',
  badge: 'Update',
  message: 'How to study smarter, not harder, with our new AI tools.',
  href: '/blog/how-to-study-smarter-with-ai',
};
