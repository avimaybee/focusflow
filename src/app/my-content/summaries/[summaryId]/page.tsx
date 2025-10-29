import Client from './client';

// Server wrapper for Cloudflare Pages; exports Edge runtime
export const runtime = 'edge';
type PageProps = {
  params: {
    summaryId: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function Page({}: PageProps) {
  return <Client />;
}