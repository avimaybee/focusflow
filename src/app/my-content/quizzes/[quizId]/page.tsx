import Client from './client';

export const runtime = 'edge';

type PageProps = {
  params: {
    quizId: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function Page({}: PageProps) {
  return <Client />;
}