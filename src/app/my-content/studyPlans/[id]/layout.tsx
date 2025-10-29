import { MyContentDetailShell } from '@/components/my-content/detail-shell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <MyContentDetailShell
      breadcrumbs={[
        { label: 'My Content', href: '/my-content' },
        { label: 'Study Plans', href: '/my-content/studyPlans' },
        { label: 'Study Plan Details' },
      ]}
      backHref="/my-content/studyPlans"
      backLabel="Back to Study Plans"
    >
      {children}
    </MyContentDetailShell>
  );
}
