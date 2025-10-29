import { MyContentDetailShell } from '@/components/my-content/detail-shell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <MyContentDetailShell
      breadcrumbs={[
        { label: 'My Content', href: '/my-content' },
        { label: 'Flashcard Sets', href: '/my-content/flashcardSets' },
        { label: 'Flashcard Set Details' },
      ]}
      backHref="/my-content/flashcardSets"
      backLabel="Back to Flashcard Sets"
    >
      {children}
    </MyContentDetailShell>
  );
}
