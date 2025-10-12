// Disabled copy of the POST proxy for /chat
// Kept for reference; do NOT name this file `route.ts` in production.

/*
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const start = Date.now();
  try {
    let body: any = null;
    try {
      body = await req.json();
    } catch (e) {}

    const apiUrl = new URL('/api/chat', req.url).toString();
    console.debug('[route /chat] proxying POST to', apiUrl, 'body:', body);

    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await resp.text();
    const headers = new Headers();
    const ct = resp.headers.get('content-type');
    if (ct) headers.set('content-type', ct);
    return new Response(text, { status: resp.status, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'content-type': 'application/json' } });
  } finally {
    console.debug('[route /chat] duration', Date.now() - start, 'ms');
  }
}
*/
