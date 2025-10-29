import { MyContentDetailShell } from '@/components/my-content/detail-shell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <MyContentDetailShell
      breadcrumbs={[
        { label: 'My Content', href: '/my-content' },
        { label: 'Summaries', href: '/my-content/summaries' },
        { label: 'Summary Details' },
      ]}
      backHref="/my-content/summaries"
      backLabel="Back to Summaries"
    >
      {children}
    </MyContentDetailShell>
  );
}
