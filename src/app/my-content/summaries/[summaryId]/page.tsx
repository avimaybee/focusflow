'use client';

import Client from './client';

// Server wrapper for Cloudflare Pages; exports Edge runtime
export const runtime = 'edge';

export default async function Page(props: any) {
  return <Client {...props} />;
}