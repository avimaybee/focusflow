import Client from './client';

// Server wrapper for Cloudflare Pages (Edge Runtime)
export const runtime = 'edge';

type PageProps = {
  params: {
    flashcardSetId: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function Page({}: PageProps) {
  return <Client />;
}