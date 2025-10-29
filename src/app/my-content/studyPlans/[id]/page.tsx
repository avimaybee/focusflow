import Client from './client';

export const runtime = 'edge';

type PageProps = {
  params: {
    id: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function Page({ params }: PageProps) {
  return <Client params={params} />;
}