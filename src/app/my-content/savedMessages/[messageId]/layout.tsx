import { MyContentDetailShell } from '@/components/my-content/detail-shell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <MyContentDetailShell
      breadcrumbs={[
        { label: 'My Content', href: '/my-content' },
        { label: 'Saved Messages', href: '/my-content/savedMessages' },
        { label: 'Saved Message Details' },
      ]}
      backHref="/my-content/savedMessages"
      backLabel="Back to Saved Messages"
    >
      {children}
    </MyContentDetailShell>
  );
}
