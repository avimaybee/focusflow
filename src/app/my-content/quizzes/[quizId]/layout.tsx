import { MyContentDetailShell } from '@/components/my-content/detail-shell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <MyContentDetailShell
      breadcrumbs={[
        { label: 'My Content', href: '/my-content' },
        { label: 'Quizzes', href: '/my-content/quizzes' },
        { label: 'Quiz Details' },
      ]}
      backHref="/my-content/quizzes"
      backLabel="Back to Quizzes"
    >
      {children}
    </MyContentDetailShell>
  );
}
