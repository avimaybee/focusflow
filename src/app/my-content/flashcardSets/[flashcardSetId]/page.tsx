import Client from './client';

// Server wrapper for Cloudflare Pages (Edge Runtime)
export const runtime = 'edge';

export default async function Page(props: any) {
  return <Client {...props} />;
}